import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(createCategoryDto: CreateCategoryDto) {
        // Check if category with same name exists
        const existing = await this.prisma.categories.findUnique({
            where: { name: createCategoryDto.name },
        });

        if (existing) {
            throw new ConflictException('Category with this name already exists');
        }

        // Generate ID
        const categoryId = `CAT${Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000)}`;

        const category = await this.prisma.categories.create({
            data: {
                id: categoryId,
                name: createCategoryDto.name,
                description: createCategoryDto.description,
            },
        });

        return { message: 'Category created successfully', category };
    }

    async findAll() {
        return this.prisma.categories.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { courses: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const category = await this.prisma.categories.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { courses: true },
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        const category = await this.prisma.categories.findUnique({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Check if new name conflicts with existing category
        if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
            const existing = await this.prisma.categories.findUnique({
                where: { name: updateCategoryDto.name },
            });

            if (existing) {
                throw new ConflictException('Category with this name already exists');
            }
        }

        const updated = await this.prisma.categories.update({
            where: { id },
            data: updateCategoryDto,
        });

        return { message: 'Category updated successfully', category: updated };
    }

    async remove(id: string) {
        const category = await this.prisma.categories.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { courses: true },
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        if (category._count.courses > 0) {
            throw new ConflictException(
                `Cannot delete category. It is used by ${category._count.courses} course(s)`,
            );
        }

        await this.prisma.categories.delete({
            where: { id },
        });

        return { message: 'Category deleted successfully' };
    }
}
