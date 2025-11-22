import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    title: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    short_description?: string;

    @IsString()
    @IsOptional()
    full_description?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    difficulty_level?: string;

    @IsString()
    @IsNotEmpty()
    category_id: string;
}
