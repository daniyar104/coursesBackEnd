import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findById(id: string) {
        const user = await this.prisma.users.findUnique({
            where: { id },
        });

        if (!user) throw new NotFoundException('User not found');

        // Exclude password hash
        const { password_hash, ...result } = user;
        return result;
    }
}
