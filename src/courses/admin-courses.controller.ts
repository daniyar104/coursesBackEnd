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
        const userId = req.user.id || req.user.userId;
        return this.coursesService.createCourse(createCourseDto, userId);
    }

    @Get()
    findAll(@Req() req) {
        const userId = req.user.id || req.user.userId;
        return this.coursesService.getAllCoursesAdmin(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req) {
        const userId = req.user.id || req.user.userId;
        return this.coursesService.getCourseWithModules(id, undefined, userId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Req() req) {
        const userId = req.user.id || req.user.userId;
        return this.coursesService.updateCourse(id, updateCourseDto, userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {
        const userId = req.user.id || req.user.userId;
        return this.coursesService.deleteCourse(id, userId);
    }
}
