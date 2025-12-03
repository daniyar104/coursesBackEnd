import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
    constructor(private prisma: PrismaService) { }

    async create(courseId: string, createModuleDto: CreateModuleDto) {
        // Verify course exists
        const course = await this.prisma.courses.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        // If position not provided, set it to the end
        let position = createModuleDto.position;
        if (position === undefined) {
            const maxPosition = await this.prisma.modules.findFirst({
                where: { course_id: courseId },
                orderBy: { position: 'desc' },
                select: { position: true },
            });
            position = maxPosition ? maxPosition.position + 1 : 0;
        }

        // Generate module ID
        const moduleId = `MOD${Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000)}`;

        const module = await this.prisma.modules.create({
            data: {
                id: moduleId,
                course_id: courseId,
                title: createModuleDto.title,
                description: createModuleDto.description,
                position,
            },
            include: {
                _count: {
                    select: { lessons: true },
                },
            },
        });

        return { message: 'Module created successfully', module };
    }

    async findAll(courseId: string) {
        const course = await this.prisma.courses.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        return this.prisma.modules.findMany({
            where: { course_id: courseId },
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { lessons: true },
                },
            },
        });
    }

    async findOne(courseId: string, id: string) {
        const module = await this.prisma.modules.findFirst({
            where: {
                id,
                course_id: courseId,
            },
            include: {
                tests: true,
                lessons: {
                    orderBy: { position: 'asc' },
                    include: {
                        tests: true,
                    },
                },
                _count: {
                    select: { lessons: true },
                },
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found');
        }

        return module;
    }

    async update(courseId: string, id: string, updateModuleDto: UpdateModuleDto) {
        const module = await this.prisma.modules.findFirst({
            where: {
                id,
                course_id: courseId,
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found');
        }

        const updated = await this.prisma.modules.update({
            where: { id },
            data: updateModuleDto,
            include: {
                _count: {
                    select: { lessons: true },
                },
            },
        });

        return { message: 'Module updated successfully', module: updated };
    }

    async remove(courseId: string, id: string) {
        const module = await this.prisma.modules.findFirst({
            where: {
                id,
                course_id: courseId,
            },
            include: {
                _count: {
                    select: { lessons: true },
                },
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found');
        }

        await this.prisma.modules.delete({
            where: { id },
        });

        return {
            message: 'Module deleted successfully',
            deletedLessons: module._count.lessons,
        };
    }

    async reorder(courseId: string, id: string, newPosition: number) {
        const module = await this.prisma.modules.findFirst({
            where: {
                id,
                course_id: courseId,
            },
        });

        if (!module) {
            throw new NotFoundException('Module not found');
        }

        const updated = await this.prisma.modules.update({
            where: { id },
            data: { position: newPosition },
        });

        return { message: 'Module position updated successfully', module: updated };
    }
}
