import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) { }

  // Все курсы
  @UseGuards(JwtAuthGuard)
  async getAllCourses() {
    // Получаем все курсы с количеством модулей
    const courses = await this.prisma.courses.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        categories: true,
        _count: { select: { modules: true } },
      },
    });

    // Считаем количество уроков в каждом курсе
    const coursesWithLessonCount = await Promise.all(
      courses.map(async (course) => {
        const lessonsCount = await this.prisma.lessons.count({
          where: {
            modules: { course_id: course.id }, // выбираем уроки через relation module -> course
          },
        });

        return {
          ...course,
          _count: { ...course._count, lessons: lessonsCount }, // добавляем количество уроков
        };
      }),
    );

    return coursesWithLessonCount;
  }

  // Конкретный курс с урокам
  async getCourseWithModules(courseId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        tests: true,
        modules: {
          orderBy: { position: 'asc' },
          include: {
            tests: true,
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                tests: true,
              },
            },
          },
        },
        categories: true, // если нужен category
        reviews: true, // если нужны отзывы
      },
    });

    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async registerForCourse(courseId: string, userId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const existingEnrollment = await this.prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return { message: 'User already enrolled', enrollment: existingEnrollment };
    }

    // Verify user exists
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate ID similar to Auth Service
    const enrollmentId = `${Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000)}`;

    const enrollment = await this.prisma.enrollments.create({
      data: {
        id: enrollmentId,
        user_id: userId,
        course_id: courseId,
        status: 'active',
        progress: 0,
      },
    });

    return { message: 'Successfully registered', enrollment };
  }

  async checkRegistration(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    return {
      isRegistered: !!enrollment,
      enrollment: enrollment || null,
    };
  }

  async completeLesson(userId: string, courseId: string, lessonId: string) {
    // 1. Check if enrollment exists
    const enrollment = await this.prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    // 2. Check if lesson exists and belongs to the course
    const lesson = await this.prisma.lessons.findFirst({
      where: {
        id: lessonId,
        modules: {
          course_id: courseId,
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found in this course');
    }

    // 3. Record completion (idempotent)
    try {
      await this.prisma.lesson_completions.create({
        data: {
          id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
        },
      });
    } catch (error) {
      // Ignore duplicate completion
    }

    // 4. Recalculate progress
    const totalLessons = await this.prisma.lessons.count({
      where: {
        modules: {
          course_id: courseId,
        },
      },
    });

    const completedLessons = await this.prisma.lesson_completions.count({
      where: {
        user_id: userId,
        course_id: courseId,
      },
    });

    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // 5. Update enrollment
    await this.prisma.enrollments.update({
      where: { id: enrollment.id },
      data: { progress },
    });

    return { message: 'Lesson completed', progress };
  }

  async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    const completedLessons = await this.prisma.lesson_completions.findMany({
      where: {
        user_id: userId,
        course_id: courseId,
      },
      select: { lesson_id: true },
    });

    return {
      progress: enrollment.progress,
      completedLessonIds: completedLessons.map((cl) => cl.lesson_id),
    };
  }

  async getEnrolledCourses(userId: string) {
    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        user_id: userId,
      },
      include: {
        courses: {
          include: {
            categories: true,
            _count: { select: { modules: true } },
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    // Count lessons for each enrolled course
    const enrolledCoursesWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const lessonsCount = await this.prisma.lessons.count({
          where: {
            modules: { course_id: enrollment.course_id },
          },
        });

        return {
          ...enrollment.courses,
          _count: {
            ...enrollment.courses._count,
            lessons: lessonsCount
          },
          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            progress: enrollment.progress,
            enrolled_at: enrollment.enrolled_at,
          },
        };
      }),
    );

    return enrolledCoursesWithDetails;
  }

  async getAllCategories() {
    const categories = await this.prisma.categories.findMany({
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  async updateLastLesson(userId: string, courseId: string, lessonId: string) {
    // 1. Check if enrollment exists
    const enrollment = await this.prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    // 2. Check if lesson exists and belongs to the course
    const lesson = await this.prisma.lessons.findFirst({
      where: {
        id: lessonId,
        modules: {
          course_id: courseId,
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found in this course');
    }

    // 3. Update last_lesson_id
    await this.prisma.enrollments.update({
      where: { id: enrollment.id },
      data: { last_lesson_id: lessonId },
    });

    return { message: 'Last lesson updated successfully' };
  }

  async getEnrolledCoursesWithLastLesson(userId: string) {
    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        user_id: userId,
      },
      include: {
        courses: {
          include: {
            categories: true,
            _count: { select: { modules: true } },
          },
        },
        last_lesson: {
          include: {
            modules: true, // Include module to get module title
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    // Count lessons for each enrolled course and format response
    const enrolledCoursesWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const lessonsCount = await this.prisma.lessons.count({
          where: {
            modules: { course_id: enrollment.course_id },
          },
        });

        return {
          ...enrollment.courses,
          _count: {
            ...enrollment.courses._count,
            lessons: lessonsCount,
          },
          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            progress: enrollment.progress,
            enrolled_at: enrollment.enrolled_at,
          },
          lastLesson: enrollment.last_lesson
            ? {
              id: enrollment.last_lesson.id,
              title: enrollment.last_lesson.title,
              module: {
                id: enrollment.last_lesson.modules.id,
                title: enrollment.last_lesson.modules.title,
              },
            }
            : null,
        };
      }),
    );

    return enrolledCoursesWithDetails;
  }

  // Admin methods
  async createCourse(createCourseDto: any) {
    // Verify category exists
    const category = await this.prisma.categories.findUnique({
      where: { id: createCourseDto.category_id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Generate course ID
    const courseId = `CRS${Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000)}`;

    const course = await this.prisma.courses.create({
      data: {
        id: courseId,
        title: createCourseDto.title,
        short_description: createCourseDto.short_description,
        full_description: createCourseDto.full_description,
        difficulty_level: createCourseDto.difficulty_level,
        category_id: createCourseDto.category_id,
      },
      include: {
        categories: true,
      },
    });

    return { message: 'Course created successfully', course };
  }

  async updateCourse(id: string, updateCourseDto: any) {
    const course = await this.prisma.courses.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // If category is being updated, verify it exists
    if (updateCourseDto.category_id) {
      const category = await this.prisma.categories.findUnique({
        where: { id: updateCourseDto.category_id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updated = await this.prisma.courses.update({
      where: { id },
      data: updateCourseDto,
      include: {
        categories: true,
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    });

    return { message: 'Course updated successfully', course: updated };
  }

  async deleteCourse(id: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Delete course (cascade will handle modules, lessons, enrollments)
    await this.prisma.courses.delete({
      where: { id },
    });

    return {
      message: 'Course deleted successfully',
      deletedModules: course._count.modules,
      affectedEnrollments: course._count.enrollments,
    };
  }

  async getAllCoursesAdmin() {
    const courses = await this.prisma.courses.findMany({
      orderBy: { created_at: 'desc' },
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

    // Count lessons for each course
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        const lessonsCount = await this.prisma.lessons.count({
          where: {
            modules: { course_id: course.id },
          },
        });

        return {
          ...course,
          _count: {
            ...course._count,
            lessons: lessonsCount,
          },
        };
      }),
    );

    return coursesWithDetails;
  }
}
