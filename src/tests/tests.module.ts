import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { UserTestsController } from './user-tests.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TestsController, UserTestsController],
  providers: [TestsService],
})
export class TestsModule { }
