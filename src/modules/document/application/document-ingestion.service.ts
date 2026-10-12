import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DocumentParserService } from './document-parser.service';
import { TextSplitterService } from './text-splitter.service';
import { EmbeddingService } from '../../vector/application/embedding.service';
import { VectorSearchService } from '../../vector/application/vector-search.service';
import { DocumentChunkRecord } from '../../vector/domain/document-chunk.repository.interface';

export interface DocumentUploadResponse {
  documentName: string;
  totalChunks: number;
  message: string;
}

@Injectable()
export class DocumentIngestionService {
  private readonly logger = new Logger(DocumentIngestionService.name);

  constructor(
    private readonly documentParser: DocumentParserService,
    private readonly textSplitter: TextSplitterService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
  ) {}

  async processAndIngestDocument(
    file: Express.Multer.File,
  ): Promise<DocumentUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided in upload request.');
    }

    let documentName = file.originalname;
    try {
      documentName = Buffer.from(file.originalname, 'binary').toString('utf8');
    } catch {
      documentName = file.originalname;
    }

    this.logger.log(`Starting ingestion pipeline for: ${documentName}`);

    // 1. Extract text from file
    const rawText = await this.documentParser.parseFile(file);
    if (!rawText || !rawText.trim()) {
      throw new BadRequestException(
        'The provided file does not contain readable text content.',
      );
    }

    // 2. Split text into overlapping chunks
    const textChunks = this.textSplitter.splitText(rawText);
    if (textChunks.length === 0) {
      throw new BadRequestException('No chunks could be produced from document.');
    }

    this.logger.log(
      `Generated ${textChunks.length} chunks. Generating embeddings...`,
    );

    // 3. Generate batch embeddings
    const chunkContents = textChunks.map((c) => c.content);
    const embeddings =
      await this.embeddingService.generateBatchEmbeddings(chunkContents);

    if (embeddings.length !== textChunks.length) {
      throw new Error(
        `Embedding count (${embeddings.length}) does not match chunk count (${textChunks.length}).`,
      );
    }

    // 4. Create chunk records and persist in PostgreSQL with pgvector
    const chunkRecords: DocumentChunkRecord[] = textChunks.map(
      (chunk, index) => ({
        documentName,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: embeddings[index],
      }),
    );

    await this.vectorSearchService.saveChunks(chunkRecords);

    this.logger.log(
      `Document ingestion completed successfully: ${documentName} (${textChunks.length} chunks).`,
    );

    return {
      documentName,
      totalChunks: textChunks.length,
      message: 'Document successfully ingested and indexed.',
    };
  }
}
