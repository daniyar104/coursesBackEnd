import { Injectable } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createTestDto: CreateTestDto) {
    const { questions, ...testData } = createTestDto;
    return this.prisma.tests.create({
      data: {
        ...testData,
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            type: q.type,
            answers: {
              create: q.answers.map((a) => ({
                text: a.text,
                is_correct: a.is_correct,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.tests.findMany({
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.tests.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  async update(id: string, updateTestDto: UpdateTestDto) {
    // For simplicity, we might not support deep nested updates here easily without more complex logic.
    // We will update the test fields and potentially recreate questions if needed, or just update test details.
    // For now, let's support updating test fields only.
    // If the user wants to update questions, they might need specific endpoints or we delete and recreate.
    // Given the complexity, let's assume basic update for now.

    // Actually, let's try to handle it if questions are provided.
    // A common strategy is to delete existing questions and create new ones if provided.

    const { questions, ...testData } = updateTestDto;

    if (questions) {
      // Transactional update
      return this.prisma.$transaction(async (prisma) => {
        await prisma.questions.deleteMany({
          where: { test_id: id },
        });

        return prisma.tests.update({
          where: { id },
          data: {
            ...testData,
            questions: {
              create: questions.map((q) => ({
                text: q.text,
                type: q.type,
                answers: {
                  create: q.answers.map((a) => ({
                    text: a.text,
                    is_correct: a.is_correct,
                  })),
                },
              })),
            },
          },
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        });
      });
    }

    return this.prisma.tests.update({
      where: { id },
      data: testData,
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  remove(id: string) {
    return this.prisma.tests.delete({
      where: { id },
    });
  }

  // Student-facing methods
  async findByLesson(lessonId: string, userId?: string) {
    const test = await this.prisma.tests.findFirst({
      where: { lesson_id: lessonId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!test) {
      return null;
    }

    // Sanitize questions (remove is_correct from answers)
    const sanitizedQuestions = test.questions.map((q) => ({
      ...q,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        question_id: a.question_id,
        created_at: a.created_at,
        // Exclude is_correct
      })),
    }));

    // Base response object
    const response = {
      ...test,
      questions: sanitizedQuestions,
      completed: false,
      passed: false,
      score: 0,
    };

    if (!userId) {
      return response;
    }

    // Get user's test result if exists
    const userResult = await this.prisma.user_test_results.findFirst({
      where: {
        user_id: userId,
        test_id: test.id,
      },
      orderBy: {
        completed_at: 'desc',
      },
    });

    if (userResult) {
      response.completed = true;
      response.passed = userResult.passed;
      response.score = userResult.score;
    }

    return response;
  }

  async findByModule(moduleId: string, userId?: string) {
    const test = await this.prisma.tests.findFirst({
      where: { module_id: moduleId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!test) {
      return null;
    }

    // Sanitize questions (remove is_correct from answers)
    const sanitizedQuestions = test.questions.map((q) => ({
      ...q,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        question_id: a.question_id,
        created_at: a.created_at,
        // Exclude is_correct
      })),
    }));

    // Base response object
    const response = {
      ...test,
      questions: sanitizedQuestions,
      completed: false,
      passed: false,
      score: 0,
    };

    if (!userId) {
      return response;
    }

    // Get user's test result if exists
    const userResult = await this.prisma.user_test_results.findFirst({
      where: {
        user_id: userId,
        test_id: test.id,
      },
      orderBy: {
        completed_at: 'desc',
      },
    });

    if (userResult) {
      response.completed = true;
      response.passed = userResult.passed;
      response.score = userResult.score;
    }

    console.log('Final response for findByModule:', JSON.stringify({
      id: response.id,
      completed: response.completed,
      passed: response.passed,
      score: response.score
    }, null, 2));

    return response;
  }

  async findByCourse(courseId: string, userId?: string) {
    const test = await this.prisma.tests.findFirst({
      where: { course_id: courseId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!test) {
      return null;
    }

    // Sanitize questions (remove is_correct from answers)
    const sanitizedQuestions = test.questions.map((q) => ({
      ...q,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        question_id: a.question_id,
        created_at: a.created_at,
        // Exclude is_correct
      })),
    }));

    // Base response object
    const response = {
      ...test,
      questions: sanitizedQuestions,
      completed: false,
      passed: false,
      score: 0,
    };

    if (!userId) {
      return response;
    }

    // Get user's test result if exists
    const userResult = await this.prisma.user_test_results.findFirst({
      where: {
        user_id: userId,
        test_id: test.id,
      },
      orderBy: {
        completed_at: 'desc',
      },
    });

    if (userResult) {
      response.completed = true;
      response.passed = userResult.passed;
      response.score = userResult.score;
    }

    return response;
  }

  async submitTest(userId: string, testId: string, submitTestDto: any) {
    // 1. Fetch test with questions and correct answers
    const test = await this.prisma.tests.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    // 2. Calculate score
    let correctAnswersCount = 0;
    const totalQuestions = test.questions.length;

    test.questions.forEach((question) => {
      const userAnswer = submitTestDto.answers.find((a) => a.questionId === question.id);
      if (userAnswer) {
        const correctAnswer = question.answers.find((a) => a.is_correct);
        if (correctAnswer && correctAnswer.id === userAnswer.answerId) {
          correctAnswersCount++;
        }
      }
    });

    const score = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
    const passed = score >= (test.passing_score || 0);

    // 3. Save result
    const result = await this.prisma.user_test_results.create({
      data: {
        user_id: userId,
        test_id: testId,
        score: score,
        passed: passed,
      },
    });

    return result;
  }

  async getTestResult(userId: string, testId: string) {
    // Get the most recent test result for this user and test
    const result = await this.prisma.user_test_results.findFirst({
      where: {
        user_id: userId,
        test_id: testId,
      },
      orderBy: {
        completed_at: 'desc',
      },
      include: {
        tests: {
          select: {
            id: true,
            title: true,
            passing_score: true,
            questions_to_show: true,
          },
        },
      },
    });

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      score: result.score,
      passed: result.passed,
      completed_at: result.completed_at,
      test: result.tests,
    };
  }

  async getModuleTestResult(userId: string, moduleId: string) {
    // 1. Find the test for this module
    const test = await this.prisma.tests.findFirst({
      where: { module_id: moduleId },
    });

    if (!test) {
      return null;
    }

    // 2. Get the result
    return this.getTestResult(userId, test.id);
  }

  async getCourseTestResult(userId: string, courseId: string) {
    // 1. Find the test for this course
    const test = await this.prisma.tests.findFirst({
      where: { course_id: courseId },
    });

    if (!test) {
      return null;
    }

    // 2. Get the result
    return this.getTestResult(userId, test.id);
  }

  // Teacher-facing methods
  async getModuleTestResults(moduleId: string) {
    // Find the test for this module
    const test = await this.prisma.tests.findFirst({
      where: { module_id: moduleId },
    });

    if (!test) {
      return [];
    }

    // Get all test results for this test with user information
    const results = await this.prisma.user_test_results.findMany({
      where: { test_id: test.id },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            sur_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        completed_at: 'desc',
      },
    });

    return results.map((result) => ({
      userId: result.users.id,
      firstName: result.users.first_name,
      surname: result.users.sur_name,
      email: result.users.email,
      score: result.score,
      passed: result.passed,
      completedAt: result.completed_at,
    }));
  }

  async getCourseTestResults(courseId: string) {
    // Find the test for this course
    const test = await this.prisma.tests.findFirst({
      where: { course_id: courseId },
    });

    if (!test) {
      return [];
    }

    // Get all test results for this test with user information
    const results = await this.prisma.user_test_results.findMany({
      where: { test_id: test.id },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            sur_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        completed_at: 'desc',
      },
    });

    return results.map((result) => ({
      userId: result.users.id,
      firstName: result.users.first_name,
      surname: result.users.sur_name,
      email: result.users.email,
      score: result.score,
      passed: result.passed,
      completedAt: result.completed_at,
    }));
  }
}
