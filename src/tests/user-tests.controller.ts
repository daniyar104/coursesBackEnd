import { Controller, Get, Param, UseGuards, Post, Body, Request } from '@nestjs/common';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SubmitTestDto } from './dto/submit-test.dto';

@Controller('user/tests')
@UseGuards(JwtAuthGuard)
export class UserTestsController {
    constructor(private readonly testsService: TestsService) { }

    @Get('lesson/:lessonId')
    getTestByLesson(@Param('lessonId') lessonId: string) {
        return this.testsService.findByLesson(lessonId);
    }

    @Get('module/:moduleId')
    getTestByModule(@Param('moduleId') moduleId: string) {
        return this.testsService.findByModule(moduleId);
    }

    @Get('course/:courseId')
    getTestByCourse(@Param('courseId') courseId: string) {
        return this.testsService.findByCourse(courseId);
    }

    @Post(':testId/submit')
    submitTest(
        @Param('testId') testId: string,
        @Body() submitTestDto: SubmitTestDto,
        @Request() req,
    ) {
        const userId = req.user.userId || req.user.id;
        return this.testsService.submitTest(userId, testId, submitTestDto);
    }
}
