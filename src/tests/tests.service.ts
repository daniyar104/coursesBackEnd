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
  findByLesson(lessonId: string) {
    return this.prisma.tests.findFirst({
      where: { lesson_id: lessonId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  findByModule(moduleId: string) {
    return this.prisma.tests.findFirst({
      where: { module_id: moduleId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  findByCourse(courseId: string) {
    return this.prisma.tests.findFirst({
      where: { course_id: courseId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
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
}
