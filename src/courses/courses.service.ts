import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

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
}
