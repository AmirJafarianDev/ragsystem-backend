import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IEmbeddingProvider } from '../../domain/embedding-provider.interface';

@Injectable()
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(OpenAIEmbeddingProvider.name);
  private readonly openai: OpenAI | null = null;
  private readonly modelName: string;
  private readonly dimension: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.openai.apiKey');
    this.modelName =
      this.configService.get<string>('app.openai.embeddingModel') ||
      'text-embedding-3-small';
    this.dimension =
      this.configService.get<number>('app.vectorDimension') || 1536;

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not provided in configuration.');
    }
  }

  private ensureClient(): OpenAI {
    if (!this.openai) {
      const apiKey = this.configService.get<string>('app.openai.apiKey');
      if (!apiKey) {
        throw new Error(
          'OPENAI_API_KEY is not configured in .env. Please provide a valid OpenAI API key.',
        );
      }
      return new OpenAI({ apiKey });
    }
    return this.openai;
  }

  getDimension(): number {
    return this.dimension;
  }

  async generateQueryEmbedding(text: string): Promise<number[]> {
    const client = this.ensureClient();
    try {
      const response = await client.embeddings.create({
        model: this.modelName,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Error generating OpenAI query embedding: ${error.message}`);
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const client = this.ensureClient();
    try {
      const batchSize = 100;
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const chunk = texts.slice(i, i + batchSize);
        const response = await client.embeddings.create({
          model: this.modelName,
          input: chunk,
        });

        const embeddings = response.data
          .sort((a, b) => a.index - b.index)
          .map((item) => item.embedding);

        allEmbeddings.push(...embeddings);
      }

      return allEmbeddings;
    } catch (error) {
      this.logger.error(
        `Error generating OpenAI batch embeddings: ${error.message}`,
      );
      throw error;
    }
  }
}
