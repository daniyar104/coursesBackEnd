import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class AdminCoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Post()
    create(@Body() createCourseDto: CreateCourseDto, @Req() req) {
        return this.coursesService.createCourse(createCourseDto, req.user.id);
    }

    @Get()
    findAll(@Req() req) {
        return this.coursesService.getAllCoursesAdmin(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req) {
        return this.coursesService.getCourseWithModules(id, undefined, req.user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Req() req) {
        return this.coursesService.updateCourse(id, updateCourseDto, req.user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {
        return this.coursesService.deleteCourse(id, req.user.id);
    }
}
