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
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
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
}
