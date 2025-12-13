import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PracticesService } from './practices.service';
import { CreatePracticeDto } from './dto/create-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('practices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PracticesController {
    constructor(private readonly practicesService: PracticesService) { }

    // Создание практики для урока. URL: /practices/lesson/:lessonId
    @Post('lesson/:lessonId')
    @Roles('admin', 'teacher')
    create(@Param('lessonId') lessonId: string, @Body() createPracticeDto: CreatePracticeDto) {
        return this.practicesService.create(lessonId, createPracticeDto);
    }

    // Получение всех практик урока
    @Get('lesson/:lessonId')
    findAllByLesson(@Param('lessonId') lessonId: string) {
        return this.practicesService.findAllByLesson(lessonId);
    }

    // Получение одной практики
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.practicesService.findOne(id);
    }

    // Обновление практики
    @Patch(':id')
    @Roles('admin', 'teacher')
    update(@Param('id') id: string, @Body() updatePracticeDto: UpdatePracticeDto) {
        return this.practicesService.update(id, updatePracticeDto);
    }

    // Удаление практики
    @Delete(':id')
    @Roles('admin', 'teacher')
    remove(@Param('id') id: string) {
        return this.practicesService.remove(id);
    }
}
