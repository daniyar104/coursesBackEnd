import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';

export class CreateAnswerDto {
    @IsString()
    text: string;

    @IsBoolean()
    @IsOptional()
    is_correct?: boolean;
}

export class CreateQuestionDto {
    @IsString()
    text: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAnswerDto)
    answers: CreateAnswerDto[];
}

export class CreateTestDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    lesson_id?: string;

    @IsString()
    @IsOptional()
    module_id?: string;

    @IsString()
    @IsOptional()
    course_id?: string;

    @IsNumber() // Should be number, but let's check validation
    @IsOptional()
    questions_to_show?: number;

    @IsNumber() // Should be number
    @IsOptional()
    passing_score?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}
