export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

export interface IEmbeddingProvider {
  /**
   * Generates embedding vector for a single query text
   */
  generateQueryEmbedding(text: string): Promise<number[]>;

  /**
   * Generates embeddings in batches for multiple text chunks
   */
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Returns vector dimension configured for this provider
   */
  getDimension(): number;
}
