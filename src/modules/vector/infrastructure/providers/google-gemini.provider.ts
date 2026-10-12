import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { IEmbeddingProvider } from '../../domain/embedding-provider.interface';

@Injectable()
export class GoogleGeminiEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(GoogleGeminiEmbeddingProvider.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly modelName: string;
  private readonly dimension: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.gemini.apiKey');
    this.modelName =
      this.configService.get<string>('app.gemini.embeddingModel') ||
      'text-embedding-004';
    this.dimension =
      this.configService.get<number>('app.vectorDimension') || 768;

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn(
        'Google Gemini API key not found in configuration. Embedding generation will fail if invoked.',
      );
    }
  }

  private ensureClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = this.configService.get<string>('app.gemini.apiKey');
      if (!apiKey) {
        throw new Error(
          'GEMINI_API_KEY is not configured in .env. Please provide a valid Google AI Studio API key.',
        );
      }
      return new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  getDimension(): number {
    return this.dimension;
  }

  async generateQueryEmbedding(text: string): Promise<number[]> {
    const client = this.ensureClient();
    const model = client.getGenerativeModel({ model: this.modelName });

    try {
      const result = await model.embedContent({
        content: { parts: [{ text }], role: 'user' },
        taskType: TaskType.RETRIEVAL_QUERY,
        outputDimensionality: this.dimension,
      } as any);

      return result.embedding.values;
    } catch (error) {
      this.logger.error(`Error generating Gemini query embedding: ${error.message}`);
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const client = this.ensureClient();
    const model = client.getGenerativeModel({ model: this.modelName });

    try {
      // Process in chunks of 50 to respect API request constraints
      const batchSize = 50;
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const chunk = texts.slice(i, i + batchSize);
        const result = await model.batchEmbedContents({
          requests: chunk.map((text) => ({
            content: { parts: [{ text }], role: 'user' },
            taskType: TaskType.RETRIEVAL_DOCUMENT,
            outputDimensionality: this.dimension,
          } as any)),
        });

        const embeddings = result.embeddings.map((e) => e.values);
        allEmbeddings.push(...embeddings);
      }

      return allEmbeddings;
    } catch (error) {
      this.logger.error(
        `Error generating Gemini batch embeddings: ${error.message}`,
      );
      throw error;
    }
  }
}
