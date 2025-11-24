import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { UserLessonsController } from './user-lessons.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [LessonsController, UserLessonsController],
    providers: [LessonsService],
    exports: [LessonsService],
})
export class LessonsModule { }
