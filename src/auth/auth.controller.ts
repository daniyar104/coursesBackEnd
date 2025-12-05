// src/auth/auth.controller.ts
import { Body, Controller, Post, Get, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { RegisterDto } from './dto/register';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // Support both camelCase and snake_case
    const firstName = dto.firstName || dto.first_name;
    const surname = dto.surname || dto.sur_name;

    if (!firstName || !surname) {
      throw new BadRequestException('firstName and surname are required');
    }

    return this.authService.register(
      firstName,
      surname,
      dto.email,
      dto.password,
      dto.role,
      dto.secretKey,
    );
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Req() req) {
    return req.user;
  }
}
