import { Controller, Get, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

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
}
