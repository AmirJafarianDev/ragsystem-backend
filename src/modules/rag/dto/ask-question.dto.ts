import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'question must not be empty' })
  question: string;

  @IsOptional()
  @IsPositive()
  topK?: number;
}
