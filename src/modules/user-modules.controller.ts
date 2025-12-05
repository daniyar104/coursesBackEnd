import {
    Controller,
    Get,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('modules')
@UseGuards(JwtAuthGuard)
export class UserModulesController {
    constructor(private readonly modulesService: ModulesService) { }

    @Get(':id')
    async getModule(@Param('id') id: string, @Request() req) {
        const userId = req.user?.userId || req.user?.id;
        return this.modulesService.getModuleById(id, userId);
    }
}
