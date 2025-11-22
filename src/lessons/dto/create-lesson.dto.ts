import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength, IsObject } from 'class-validator';

export class CreateLessonDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    title: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    position?: number;
}
