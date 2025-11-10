// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(
    firstName: string,
    surname: string,
    email: string,
    password: string,
  ) {
    const existingUser = await this.prisma.users.findUnique({ where: { email } });
    if (existingUser)
      throw new UnauthorizedException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId =
      Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000);

    const user = await this.prisma.users.create({
      data: {
        user_id: userId,
        firstName,
        surname,
        email,
        password_hash: hashedPassword,
      },
    });
    return { user };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ userId: user.user_id, email: user.email });
    return { user, token };
  }

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.users.findUnique({ where: { user_id: payload.userId } });
      return user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
