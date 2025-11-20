import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) { }

  @Get()
  async getAll() {
    const courses = await this.coursesService.getAllCourses();
    return { data: courses };
  }
  @Get(':id')
  async getCourse(@Param('id') id: string) {
    const course = await this.coursesService.getCourseWithModules(id);
    return { data: course }; // можно оборачивать в {data} для консистентности API
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  async register(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId || req.user.id; // Handle potential payload differences
    return this.coursesService.registerForCourse(id, userId);
  }

  @Post(':id/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(
    @Param('id') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.coursesService.completeLesson(userId, courseId, lessonId);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  async getProgress(@Param('id') courseId: string, @Request() req) {
    const userId = req.user.userId || req.user.id;
    return this.coursesService.getCourseProgress(userId, courseId);
  }
}
