import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILlmChatProvider } from '../../domain/llm-provider.interface';

@Injectable()
export class GoogleGeminiChatProvider implements ILlmChatProvider {
  private readonly logger = new Logger(GoogleGeminiChatProvider.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.gemini.apiKey');
    this.modelName =
      this.configService.get<string>('app.gemini.chatModel') || 'gemini-1.5-flash';

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('Google Gemini API key not found in configuration.');
    }
  }

  private ensureClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = this.configService.get<string>('app.gemini.apiKey');
      if (!apiKey) {
        throw new Error(
          'GEMINI_API_KEY is missing in .env. Please provide a valid Google AI Studio API key.',
        );
      }
      return new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  async generateAnswer(
    systemPrompt: string,
    userQuestion: string,
    temperature: number = 0.2,
  ): Promise<string> {
    const client = this.ensureClient();
    try {
      const model = client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature,
        },
      });

      const result = await model.generateContent(userQuestion);
      return result.response.text();
    } catch (error: any) {
      // If primary model encounters high demand (503), gracefully fallback to gemini-3.5-flash
      if (this.modelName !== 'gemini-3.5-flash' && (error.message?.includes('503') || error.message?.includes('429'))) {
        this.logger.warn(
          `Model "${this.modelName}" reported busy (${error.message}). Gracefully falling back to gemini-3.5-flash...`,
        );
        try {
          const fallbackModel = client.getGenerativeModel({
            model: 'gemini-3.5-flash',
            systemInstruction: systemPrompt,
            generationConfig: {
              temperature,
            },
          });
          const fallbackResult = await fallbackModel.generateContent(userQuestion);
          return fallbackResult.response.text();
        } catch (fallbackError: any) {
          this.logger.error(`Fallback error: ${fallbackError.message}`);
        }
      }

      this.logger.error(`Error generating Gemini answer: ${error.message}`);
      throw error;
    }
  }
}
