import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ILlmChatProvider } from '../../domain/llm-provider.interface';

@Injectable()
export class OpenAIChatProvider implements ILlmChatProvider {
  private readonly logger = new Logger(OpenAIChatProvider.name);
  private readonly openai: OpenAI | null = null;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.openai.apiKey');
    this.modelName =
      this.configService.get<string>('app.openai.chatModel') || 'gpt-4o-mini';

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not found in configuration.');
    }
  }

  private ensureClient(): OpenAI {
    if (!this.openai) {
      const apiKey = this.configService.get<string>('app.openai.apiKey');
      if (!apiKey) {
        throw new Error(
          'OPENAI_API_KEY is missing in .env. Please provide a valid OpenAI API key.',
        );
      }
      return new OpenAI({ apiKey });
    }
    return this.openai;
  }

  async generateAnswer(
    systemPrompt: string,
    userQuestion: string,
    temperature: number = 0.2,
  ): Promise<string> {
    const client = this.ensureClient();
    try {
      const response = await client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuestion },
        ],
        temperature,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(`Error generating OpenAI answer: ${error.message}`);
      throw error;
    }
  }
}
