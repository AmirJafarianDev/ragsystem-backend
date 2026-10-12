import { Inject, Injectable } from '@nestjs/common';
import {
  EMBEDDING_PROVIDER,
  IEmbeddingProvider,
} from '../domain/embedding-provider.interface';

@Injectable()
export class EmbeddingService {
  constructor(
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: IEmbeddingProvider,
  ) {}

  async generateEmbedding(text: string): Promise<number[]> {
    return this.embeddingProvider.generateQueryEmbedding(text);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return this.embeddingProvider.generateBatchEmbeddings(texts);
  }

  getDimension(): number {
    return this.embeddingProvider.getDimension();
  }
}
