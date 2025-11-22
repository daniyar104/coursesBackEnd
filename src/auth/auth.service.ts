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
  ) { }

  async register(
    firstName: string,
    surname: string,
    email: string,
    password: string,
    role: string = 'student',
    secretKey?: string,
  ) {
    // Verify secret key for privileged roles
    if (role === 'teacher' || role === 'admin') {
      const validSecret = process.env.ADMIN_SECRET_KEY || 'super_secret_admin_key';
      if (secretKey !== validSecret) {
        throw new UnauthorizedException('Invalid secret key for privileged role');
      }
    } else {
      // Force student role if not privileged
      role = 'student';
    }

    const existingUser = await this.prisma.users.findUnique({ where: { email } });
    if (existingUser)
      throw new UnauthorizedException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = `${Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000)}`;

    const user = await this.prisma.users.create({
      data: {
        id: userId,
        first_name: firstName,
        sur_name: surname,
        email,
        password_hash: hashedPassword,
        role,
      },
    });
    return { user };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return { user, token };
  }

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.users.findUnique({ where: { id: payload.sub } });
      return user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
