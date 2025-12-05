import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) { }

  @Post()
  create(@Body() createTestDto: CreateTestDto) {
    return this.testsService.create(createTestDto);
  }

  @Get()
  findAll() {
    return this.testsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
    return this.testsService.update(id, updateTestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testsService.remove(id);
  }

  @Get('module/:moduleId/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  getModuleTestResults(@Param('moduleId') moduleId: string) {
    return this.testsService.getModuleTestResults(moduleId);
  }

  @Get('course/:courseId/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  getCourseTestResults(@Param('courseId') courseId: string) {
    return this.testsService.getCourseTestResults(courseId);
  }
}
