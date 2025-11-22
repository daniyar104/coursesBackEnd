import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('admin/courses/:courseId/modules/:moduleId/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class LessonsController {
    constructor(private readonly lessonsService: LessonsService) { }

    @Post()
    create(
        @Param('courseId') courseId: string,
        @Param('moduleId') moduleId: string,
        @Body() createLessonDto: CreateLessonDto,
    ) {
        return this.lessonsService.create(courseId, moduleId, createLessonDto);
    }

    @Get()
    findAll(
        @Param('courseId') courseId: string,
        @Param('moduleId') moduleId: string,
    ) {
        return this.lessonsService.findAll(courseId, moduleId);
    }

    @Get(':id')
    findOne(
        @Param('courseId') courseId: string,
        @Param('moduleId') moduleId: string,
        @Param('id') id: string,
    ) {
        return this.lessonsService.findOne(courseId, moduleId, id);
    }

    @Patch(':id')
    update(
        @Param('courseId') courseId: string,
        @Param('moduleId') moduleId: string,
        @Param('id') id: string,
        @Body() updateLessonDto: UpdateLessonDto,
    ) {
        return this.lessonsService.update(courseId, moduleId, id, updateLessonDto);
    }

    @Delete(':id')
    remove(
        @Param('courseId') courseId: string,
        @Param('moduleId') moduleId: string,
        @Param('id') id: string,
    ) {
        return this.lessonsService.remove(courseId, moduleId, id);
    }

    @Patch(':id/reorder')
    reorder(
        @Param('courseId') courseId: string,
        @Param('moduleId') moduleId: string,
        @Param('id') id: string,
        @Body('position') position: number,
    ) {
        return this.lessonsService.reorder(courseId, moduleId, id, position);
    }

    @Post(':id/material')
    @UseInterceptors(FileInterceptor('file'))
    async uploadMaterial(
        @Param('courseId') courseId: string,
        @Param('moduleId') moduleId: string,
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        console.log('Upload request received for lesson:', id);
        console.log('File:', file);
        return this.lessonsService.uploadMaterial(courseId, moduleId, id, file);
    }
}
