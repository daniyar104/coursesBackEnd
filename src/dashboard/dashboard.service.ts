import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getOverallStats() {
        // Get total counts
        const [
            totalCourses,
            totalModules,
            totalLessons,
            totalEnrollments,
            totalCategories,
            totalReviews,
        ] = await Promise.all([
            this.prisma.courses.count(),
            this.prisma.modules.count(),
            this.prisma.lessons.count(),
            this.prisma.enrollments.count(),
            this.prisma.categories.count(),
            this.prisma.reviews.count(),
        ]);

        // Get average rating across all courses
        const avgRatingResult = await this.prisma.courses.aggregate({
            _avg: {
                avg_rating: true,
            },
        });

        // Get active enrollments (status = 'active')
        const activeEnrollments = await this.prisma.enrollments.count({
            where: { status: 'active' },
        });

        // Get recent enrollments (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentEnrollments = await this.prisma.enrollments.count({
            where: {
                enrolled_at: {
                    gte: thirtyDaysAgo,
                },
            },
        });

        // Get top 5 courses by enrollment count
        const topCourses = await this.prisma.courses.findMany({
            take: 5,
            orderBy: {
                enrollments: {
                    _count: 'desc',
                },
            },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        reviews: true,
                    },
                },
                categories: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return {
            overview: {
                totalCourses,
                totalModules,
                totalLessons,
                totalEnrollments,
                totalCategories,
                totalReviews,
                activeEnrollments,
                averageRating: avgRatingResult._avg.avg_rating || 0,
            },
            recentActivity: {
                enrollmentsLast30Days: recentEnrollments,
            },
            topCourses: topCourses.map(course => ({
                id: course.id,
                title: course.title,
                category: course.categories?.name,
                enrollmentCount: course._count.enrollments,
                reviewCount: course._count.reviews,
                avgRating: course.avg_rating,
            })),
        };
    }

    async getCourseStats(courseId: string) {
        // Get course with all related data
        const course = await this.prisma.courses.findUnique({
            where: { id: courseId },
            include: {
                categories: true,
                _count: {
                    select: {
                        modules: true,
                        enrollments: true,
                        reviews: true,
                    },
                },
            },
        });

        if (!course) {
            return null;
        }

        // Count lessons
        const lessonsCount = await this.prisma.lessons.count({
            where: {
                modules: {
                    course_id: courseId,
                },
            },
        });

        // Get enrollment statistics
        const enrollments = await this.prisma.enrollments.findMany({
            where: { course_id: courseId },
            select: {
                status: true,
                progress: true,
                enrolled_at: true,
            },
        });

        const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
        const completedEnrollments = enrollments.filter(
            e => Number(e.progress) === 100
        ).length;

        const averageProgress = enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + Number(e.progress), 0) / enrollments.length
            : 0;

        // Get enrollment trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const enrollmentTrend = await this.prisma.enrollments.groupBy({
            by: ['enrolled_at'],
            where: {
                course_id: courseId,
                enrolled_at: {
                    gte: sevenDaysAgo,
                },
            },
            _count: true,
        });

        // Get recent reviews
        const recentReviews = await this.prisma.reviews.findMany({
            where: { course_id: courseId },
            take: 5,
            orderBy: { review_date: 'desc' },
            include: {
                users: {
                    select: {
                        first_name: true,
                        sur_name: true,
                    },
                },
            },
        });

        // Get rating distribution
        const ratingDistribution = await this.prisma.reviews.groupBy({
            by: ['rating'],
            where: { course_id: courseId },
            _count: true,
        });

        // Get lesson completion stats
        const lessonCompletions = await this.prisma.lesson_completions.count({
            where: { course_id: courseId },
        });

        const totalPossibleCompletions = lessonsCount * course._count.enrollments;
        const completionRate = totalPossibleCompletions > 0
            ? (lessonCompletions / totalPossibleCompletions) * 100
            : 0;

        return {
            course: {
                id: course.id,
                title: course.title,
                category: course.categories?.name,
                difficulty: course.difficulty_level,
                avgRating: course.avg_rating,
                reviewCount: course.review_count,
            },
            content: {
                modulesCount: course._count.modules,
                lessonsCount,
            },
            enrollments: {
                total: course._count.enrollments,
                active: activeEnrollments,
                completed: completedEnrollments,
                averageProgress: Math.round(averageProgress * 100) / 100,
            },
            engagement: {
                lessonCompletions,
                completionRate: Math.round(completionRate * 100) / 100,
            },
            reviews: {
                total: course._count.reviews,
                ratingDistribution: ratingDistribution.map(r => ({
                    rating: r.rating,
                    count: r._count,
                })),
                recent: recentReviews.map(r => ({
                    id: r.id,
                    rating: r.rating,
                    text: r.text,
                    date: r.review_date,
                    user: `${r.users.first_name} ${r.users.sur_name}`,
                })),
            },
            trend: {
                enrollmentsLast7Days: enrollmentTrend.length,
            },
        };
    }

    async getAllCoursesStats() {
        const courses = await this.prisma.courses.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                categories: {
                    select: {
                        name: true,
                    },
                },
                _count: {
                    select: {
                        modules: true,
                        enrollments: true,
                        reviews: true,
                    },
                },
            },
        });

        // Get lessons count and enrollment details for each course
        const coursesWithStats = await Promise.all(
            courses.map(async (course) => {
                const lessonsCount = await this.prisma.lessons.count({
                    where: {
                        modules: { course_id: course.id },
                    },
                });

                const activeEnrollments = await this.prisma.enrollments.count({
                    where: {
                        course_id: course.id,
                        status: 'active',
                    },
                });

                const enrollments = await this.prisma.enrollments.findMany({
                    where: { course_id: course.id },
                    select: { progress: true },
                });

                const averageProgress = enrollments.length > 0
                    ? enrollments.reduce((sum, e) => sum + Number(e.progress), 0) / enrollments.length
                    : 0;

                return {
                    id: course.id,
                    title: course.title,
                    category: course.categories?.name,
                    difficulty: course.difficulty_level,
                    avgRating: course.avg_rating,
                    content: {
                        modules: course._count.modules,
                        lessons: lessonsCount,
                    },
                    enrollments: {
                        total: course._count.enrollments,
                        active: activeEnrollments,
                        averageProgress: Math.round(averageProgress * 100) / 100,
                    },
                    reviews: {
                        total: course._count.reviews,
                    },
                };
            }),
        );

        return coursesWithStats;
    }
}
