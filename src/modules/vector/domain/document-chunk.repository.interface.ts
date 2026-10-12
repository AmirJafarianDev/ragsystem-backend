export interface DocumentChunkRecord {
  id?: string;
  documentName: string;
  content: string;
  chunkIndex: number;
  embedding: number[];
  distance?: number;
}

export const DOCUMENT_CHUNK_REPOSITORY = Symbol('DOCUMENT_CHUNK_REPOSITORY');

export interface IDocumentChunkRepository {
  /**
   * Save chunks with embeddings in batch
   */
  saveChunks(chunks: DocumentChunkRecord[]): Promise<void>;

  /**
   * Find most similar chunks using cosine distance (<=>)
   */
  findSimilarChunks(
    queryEmbedding: number[],
    limit: number,
  ): Promise<DocumentChunkRecord[]>;

  /**
   * Initialize table and vector extension & HNSW index
   */
  initializeVectorDatabase(dimension: number): Promise<void>;
}
