import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { UserModulesController } from './user-modules.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ModulesController, UserModulesController],
    providers: [ModulesService],
    exports: [ModulesService],
})
export class ModulesModule { }
