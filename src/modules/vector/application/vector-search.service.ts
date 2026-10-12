import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_CHUNK_REPOSITORY,
  DocumentChunkRecord,
  IDocumentChunkRepository,
} from '../domain/document-chunk.repository.interface';

@Injectable()
export class VectorSearchService {
  constructor(
    @Inject(DOCUMENT_CHUNK_REPOSITORY)
    private readonly chunkRepository: IDocumentChunkRepository,
  ) {}

  async searchSimilarChunks(
    queryEmbedding: number[],
    limit: number = 4,
  ): Promise<DocumentChunkRecord[]> {
    return this.chunkRepository.findSimilarChunks(queryEmbedding, limit);
  }

  async saveChunks(chunks: DocumentChunkRecord[]): Promise<void> {
    return this.chunkRepository.saveChunks(chunks);
  }

  async initializeDatabase(dimension: number): Promise<void> {
    return this.chunkRepository.initializeVectorDatabase(dimension);
  }
}
