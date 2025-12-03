import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerSubmission {
    @IsString()
    questionId: string;

    @IsString()
    answerId: string;
}

export class SubmitTestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnswerSubmission)
    answers: AnswerSubmission[];
}
