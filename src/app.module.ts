import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TestsModule } from './tests/tests.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CoursesModule,
    UsersModule,
    CategoriesModule,
    ModulesModule,
    LessonsModule,
    DashboardModule,
    SupabaseModule,
    TestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
