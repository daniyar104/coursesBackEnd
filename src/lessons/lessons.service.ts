import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class LessonsService {
    constructor(
        private prisma: PrismaService,
        private supabaseService: SupabaseService,
    ) { }

    async uploadMaterial(courseId: string, moduleId: string, lessonId: string, file: Express.Multer.File) {
        // Verify lesson exists and belongs to module/course
        const lesson = await this.prisma.lessons.findFirst({
            where: {
                id: lessonId,
                module_id: moduleId,
                modules: {
                    course_id: courseId,
                },
            },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        // Upload file
        const publicUrl = await this.supabaseService.uploadFile(file, 'materials');

        // Update lesson with material URL
        return this.prisma.lessons.update({
            where: { id: lessonId },
            data: {
                material_url: publicUrl,
            },
        });
    }

    async create(
        courseId: string,
        moduleId: string,
        createLessonDto: CreateLessonDto,
    ) {
        // Verify module exists and belongs to course
        const module = await this.prisma.modules.findFirst({
            where: {
                id: moduleId,
                course_id: courseId,
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found in this course');
        }

        // If position not provided, set it to the end
        let position = createLessonDto.position;
        if (position === undefined) {
            const maxPosition = await this.prisma.lessons.findFirst({
                where: { module_id: moduleId },
                orderBy: { position: 'desc' },
                select: { position: true },
            });
            position = maxPosition ? maxPosition.position + 1 : 0;
        }

        // Generate lesson ID
        const lessonId = `LSN${Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000)}`;

        const lesson = await this.prisma.lessons.create({
            data: {
                id: lessonId,
                module_id: moduleId,
                title: createLessonDto.title,
                content: createLessonDto.content,
                position,
            },
        });

        return { message: 'Lesson created successfully', lesson };
    }

    async findAll(courseId: string, moduleId: string) {
        // Verify module exists and belongs to course
        const module = await this.prisma.modules.findFirst({
            where: {
                id: moduleId,
                course_id: courseId,
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found in this course');
        }

        return this.prisma.lessons.findMany({
            where: { module_id: moduleId },
            orderBy: { position: 'asc' },
        });
    }

    async findOne(courseId: string, moduleId: string, id: string) {
        // Verify module exists and belongs to course
        const module = await this.prisma.modules.findFirst({
            where: {
                id: moduleId,
                course_id: courseId,
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found in this course');
        }

        const lesson = await this.prisma.lessons.findFirst({
            where: {
                id,
                module_id: moduleId,
            },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        return lesson;
    }

    async update(
        courseId: string,
        moduleId: string,
        id: string,
        updateLessonDto: UpdateLessonDto,
    ) {
        // Verify module exists and belongs to course
        const module = await this.prisma.modules.findFirst({
            where: {
                id: moduleId,
                course_id: courseId,
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found in this course');
        }

        const lesson = await this.prisma.lessons.findFirst({
            where: {
                id,
                module_id: moduleId,
            },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        const updated = await this.prisma.lessons.update({
            where: { id },
            data: updateLessonDto,
        });

        return { message: 'Lesson updated successfully', lesson: updated };
    }

    async remove(courseId: string, moduleId: string, id: string) {
        // Verify module exists and belongs to course
        const module = await this.prisma.modules.findFirst({
            where: {
                id: moduleId,
                course_id: courseId,
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found in this course');
        }

        const lesson = await this.prisma.lessons.findFirst({
            where: {
                id,
                module_id: moduleId,
            },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        await this.prisma.lessons.delete({
            where: { id },
        });

        return { message: 'Lesson deleted successfully' };
    }

    async reorder(
        courseId: string,
        moduleId: string,
        id: string,
        newPosition: number,
    ) {
        // Verify module exists and belongs to course
        const module = await this.prisma.modules.findFirst({
            where: {
                id: moduleId,
                course_id: courseId,
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found in this course');
        }

        const lesson = await this.prisma.lessons.findFirst({
            where: {
                id,
                module_id: moduleId,
            },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        const updated = await this.prisma.lessons.update({
            where: { id },
            data: { position: newPosition },
        });

        return { message: 'Lesson position updated successfully', lesson: updated };
    }
}
