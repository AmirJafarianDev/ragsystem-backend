import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  DocumentChunkRecord,
  IDocumentChunkRepository,
} from '../../domain/document-chunk.repository.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class TypeOrmDocumentChunkRepository implements IDocumentChunkRepository {
  private readonly logger = new Logger(TypeOrmDocumentChunkRepository.name);

  constructor(private readonly dataSource: DataSource) {}

  async initializeVectorDatabase(dimension: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      this.logger.log('Initializing PostgreSQL vector extension and schema...');

      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS vector;');
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

      // Create table if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY,
          document_name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          chunk_index INT NOT NULL,
          embedding vector(${dimension}) NOT NULL
        );
      `);

      // Create HNSW index for cosine distance
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
        ON document_chunks USING hnsw (embedding vector_cosine_ops);
      `);

      this.logger.log(
        `Vector database initialized successfully with dimension ${dimension} and HNSW index.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize vector database: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async saveChunks(chunks: DocumentChunkRecord[]): Promise<void> {
    if (!chunks || chunks.length === 0) return;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const chunk of chunks) {
        const id = chunk.id || randomUUID();
        const vectorString = `[${chunk.embedding.join(',')}]`;

        await queryRunner.query(
          `INSERT INTO document_chunks (id, document_name, content, chunk_index, embedding)
           VALUES ($1, $2, $3, $4, $5::vector)`,
          [id, chunk.documentName, chunk.content, chunk.chunkIndex, vectorString],
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully stored ${chunks.length} chunks into database.`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error saving document chunks: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findSimilarChunks(
    queryEmbedding: number[],
    limit: number,
  ): Promise<DocumentChunkRecord[]> {
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const rawResults = await this.dataSource.query(
      `SELECT id, document_name AS "documentName", content, chunk_index AS "chunkIndex",
              (embedding <=> $1::vector) AS distance
       FROM document_chunks
       ORDER BY distance ASC
       LIMIT $2;`,
      [vectorString, limit],
    );

    return rawResults.map((r: any) => ({
      id: r.id,
      documentName: r.documentName,
      content: r.content,
      chunkIndex: Number(r.chunkIndex),
      embedding: [],
      distance: parseFloat(r.distance),
    }));
  }
}
