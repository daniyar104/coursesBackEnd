// src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  surname: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
