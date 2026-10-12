import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  vectorDimension: parseInt(process.env.VECTOR_DIMENSION, 10) || 768,
  chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || 800,
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || 100,
  ragTopK: parseInt(process.env.RAG_TOP_K, 10) || 4,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  },
}));
