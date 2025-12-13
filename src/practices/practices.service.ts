import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePracticeDto } from './dto/create-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';

@Injectable()
export class PracticesService {
    constructor(private prisma: PrismaService) { }

    async create(lessonId: string, createPracticeDto: CreatePracticeDto) {
        const lesson = await this.prisma.lessons.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        return this.prisma.practices.create({
            data: {
                ...createPracticeDto,
                lesson_id: lessonId,
            },
        });
    }

    async findAllByLesson(lessonId: string) {
        return this.prisma.practices.findMany({
            where: { lesson_id: lessonId },
            orderBy: { created_at: 'asc' },
        });
    }

    async findOne(id: string) {
        const practice = await this.prisma.practices.findUnique({
            where: { id },
        });
        if (!practice) {
            throw new NotFoundException('Practice not found');
        }
        return practice;
    }

    async update(id: string, updatePracticeDto: UpdatePracticeDto) {
        await this.findOne(id); // Check existence
        return this.prisma.practices.update({
            where: { id },
            data: updatePracticeDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Check existence
        return this.prisma.practices.delete({
            where: { id },
        });
    }
}

