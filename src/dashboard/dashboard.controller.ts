import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    async getOverallStats() {
        const stats = await this.dashboardService.getOverallStats();
        return { data: stats };
    }

    @Get('courses')
    async getAllCoursesStats() {
        const courses = await this.dashboardService.getAllCoursesStats();
        return { data: courses };
    }

    @Get('courses/:id/stats')
    async getCourseStats(@Param('id') id: string) {
        const stats = await this.dashboardService.getCourseStats(id);

        if (!stats) {
            return { message: 'Course not found' };
        }

        return { data: stats };
    }
}
