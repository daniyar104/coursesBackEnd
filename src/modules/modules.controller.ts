import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/courses/:courseId/modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class ModulesController {
    constructor(private readonly modulesService: ModulesService) { }

    @Post()
    create(
        @Param('courseId') courseId: string,
        @Body() createModuleDto: CreateModuleDto,
    ) {
        return this.modulesService.create(courseId, createModuleDto);
    }

    @Get()
    findAll(@Param('courseId') courseId: string) {
        return this.modulesService.findAll(courseId);
    }

    @Get(':id')
    findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
        return this.modulesService.findOne(courseId, id);
    }

    @Patch(':id')
    update(
        @Param('courseId') courseId: string,
        @Param('id') id: string,
        @Body() updateModuleDto: UpdateModuleDto,
    ) {
        return this.modulesService.update(courseId, id, updateModuleDto);
    }

    @Delete(':id')
    remove(@Param('courseId') courseId: string, @Param('id') id: string) {
        return this.modulesService.remove(courseId, id);
    }

    @Patch(':id/reorder')
    reorder(
        @Param('courseId') courseId: string,
        @Param('id') id: string,
        @Body('position') position: number,
    ) {
        return this.modulesService.reorder(courseId, id, position);
    }
}
