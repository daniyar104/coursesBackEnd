import {
    Controller,
    Get,
    Param,
    UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class UserLessonsController {
    constructor(private readonly lessonsService: LessonsService) { }

    /**
     * Get material URL for a specific lesson
     * Returns a signed URL that expires in 1 hour
     */
    @Get(':id/material')
    getMaterialUrl(@Param('id') id: string) {
        return this.lessonsService.getMaterialUrl(id);
    }
}
