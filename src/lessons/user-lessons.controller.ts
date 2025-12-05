import {
    Controller,
    Get,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class UserLessonsController {
    constructor(private readonly lessonsService: LessonsService) { }

    @Get(':id')
    async getLesson(@Param('id') id: string, @Request() req) {
        const userId = req.user?.userId || req.user?.id;
        return this.lessonsService.getLessonById(id, userId);
    }

    /**
     * Get material URL for a specific lesson
     * Returns a signed URL that expires in 1 hour
     */
    @Get(':id/material')
    getMaterialUrl(@Param('id') id: string) {
        return this.lessonsService.getMaterialUrl(id);
    }
}
