import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePracticeDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsString()
    initial_code?: string;

    @IsOptional()
    @IsString()
    expected_output?: string;

    @IsOptional()
    test_cases?: any; // Json

    @IsOptional()
    @IsString()
    solution_code?: string;
}
