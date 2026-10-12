import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunk } from './infrastructure/entities/document-chunk.entity';
import { DOCUMENT_CHUNK_REPOSITORY } from './domain/document-chunk.repository.interface';
import { TypeOrmDocumentChunkRepository } from './infrastructure/repositories/typeorm-document-chunk.repository';
import { EMBEDDING_PROVIDER } from './domain/embedding-provider.interface';
import { GoogleGeminiEmbeddingProvider } from './infrastructure/providers/google-gemini.provider';
import { OpenAIEmbeddingProvider } from './infrastructure/providers/openai.provider';
import { EmbeddingService } from './application/embedding.service';
import { VectorSearchService } from './application/vector-search.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([DocumentChunk])],
  providers: [
    TypeOrmDocumentChunkRepository,
    {
      provide: DOCUMENT_CHUNK_REPOSITORY,
      useExisting: TypeOrmDocumentChunkRepository,
    },
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('app.aiProvider');
        if (provider === 'openai') {
          return new OpenAIEmbeddingProvider(configService);
        }
        return new GoogleGeminiEmbeddingProvider(configService);
      },
      inject: [ConfigService],
    },
    EmbeddingService,
    VectorSearchService,
  ],
  exports: [EmbeddingService, VectorSearchService, DOCUMENT_CHUNK_REPOSITORY],
})
export class VectorModule implements OnModuleInit {
  private readonly logger = new Logger(VectorModule.name);

  constructor(
    private readonly vectorSearchService: VectorSearchService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const dimension =
        this.configService.get<number>('app.vectorDimension') || 768;
      await this.vectorSearchService.initializeDatabase(dimension);
    } catch (error) {
      this.logger.error(
        `Failed to auto-initialize vector database on module startup: ${error.message}. Ensure PostgreSQL with pgvector is running.`,
      );
    }
  }
}
