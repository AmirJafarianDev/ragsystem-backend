import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RagService } from './rag.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AskQuestionResponseDto } from './dto/ask-question-response.dto';

@Controller('api/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async askQuestion(
    @Body() dto: AskQuestionDto,
  ): Promise<AskQuestionResponseDto> {
    return this.ragService.answerQuestion(dto);
  }
}
