import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength, IsEnum } from 'class-validator';

export enum MaterialType {
    PRESENTATION = 'PRESENTATION',
    VIDEO = 'VIDEO',
    LECTURE_MATERIAL = 'LECTURE_MATERIAL',
}

export class CreateLessonDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    title: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsEnum(MaterialType)
    @IsNotEmpty()
    material_type: MaterialType;

    @IsInt()
    @Min(0)
    @IsOptional()
    position?: number;
}
