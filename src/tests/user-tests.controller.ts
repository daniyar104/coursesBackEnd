import { Controller, Get, Param, UseGuards, Post, Body, Request } from '@nestjs/common';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SubmitTestDto } from './dto/submit-test.dto';

@Controller('user/tests')
@UseGuards(JwtAuthGuard)
export class UserTestsController {
    constructor(private readonly testsService: TestsService) { }

    @Get('lesson/:lessonId')
    getTestByLesson(@Param('lessonId') lessonId: string, @Request() req) {
        const userId = req.user.userId || req.user.id;
        return this.testsService.findByLesson(lessonId, userId);
    }

    @Get('module/:moduleId')
    getTestByModule(@Param('moduleId') moduleId: string, @Request() req) {
        const userId = req.user.userId || req.user.id;
        return this.testsService.findByModule(moduleId, userId);
    }

    @Get('course/:courseId')
    getTestByCourse(@Param('courseId') courseId: string, @Request() req) {
        const userId = req.user.userId || req.user.id;
        return this.testsService.findByCourse(courseId, userId);
    }

    @Get(':testId/result')
    getTestResult(@Param('testId') testId: string, @Request() req) {
        const userId = req.user.userId || req.user.id;
        return this.testsService.getTestResult(userId, testId);
    }

    @Get('module/:moduleId/result')
    getModuleTestResult(@Param('moduleId') moduleId: string, @Request() req) {
        const userId = req.user.userId || req.user.id;
        return this.testsService.getModuleTestResult(userId, moduleId);
    }

    @Get('course/:courseId/result')
    getCourseTestResult(@Param('courseId') courseId: string, @Request() req) {
        const userId = req.user.userId || req.user.id;
        return this.testsService.getCourseTestResult(userId, courseId);
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
