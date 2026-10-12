import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from '../vector/application/embedding.service';
import { VectorSearchService } from '../vector/application/vector-search.service';
import {
  ILlmChatProvider,
  LLM_CHAT_PROVIDER,
} from './domain/llm-provider.interface';
import { AskQuestionDto } from './dto/ask-question.dto';
import {
  AskQuestionResponseDto,
  SourceChunkDto,
} from './dto/ask-question-response.dto';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly defaultTopK: number;
  private readonly modelName: string;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearchService: VectorSearchService,
    @Inject(LLM_CHAT_PROVIDER)
    private readonly llmProvider: ILlmChatProvider,
    private readonly configService: ConfigService,
  ) {
    this.defaultTopK = this.configService.get<number>('app.ragTopK') || 4;
    const provider = this.configService.get<string>('app.aiProvider');
    this.modelName =
      provider === 'openai'
        ? this.configService.get<string>('app.openai.chatModel') || 'gpt-4o-mini'
        : this.configService.get<string>('app.gemini.chatModel') || 'gemini-1.5-flash';
  }

  async answerQuestion(dto: AskQuestionDto): Promise<AskQuestionResponseDto> {
    const { question, topK } = dto;
    const k = topK || this.defaultTopK;

    this.logger.log(`Processing RAG question: "${question}" (topK: ${k})`);

    // 1. Generate query embedding
    const queryEmbedding = await this.embeddingService.generateEmbedding(question);

    // 2. Perform cosine similarity vector search in PostgreSQL (pgvector <=> operator)
    const matchedChunks = await this.vectorSearchService.searchSimilarChunks(
      queryEmbedding,
      k,
    );

    this.logger.log(`Found ${matchedChunks.length} relevant chunks via pgvector.`);

    // 3. Format sources
    const sources: SourceChunkDto[] = matchedChunks.map((chunk) => ({
      id: chunk.id,
      documentName: chunk.documentName,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      distance: chunk.distance,
      similarityScore:
        chunk.distance !== undefined
          ? Math.max(0, parseFloat((1 - chunk.distance).toFixed(4)))
          : undefined,
    }));

    // If no context found in database
    if (sources.length === 0) {
      return {
        question,
        answer:
          'No documents have been indexed yet in the vector database. Please upload documents first via POST /api/documents/upload.',
        sources: [],
        modelUsed: this.modelName,
        timestamp: new Date().toISOString(),
      };
    }

    // 4. Construct context block and system prompt
    const contextText = sources
      .map(
        (src, idx) =>
          `[Source ${idx + 1} - File: "${src.documentName}" - Chunk: #${src.chunkIndex}]\n${src.content}`,
      )
      .join('\n\n---\n\n');

    const systemPrompt = `You are an expert AI assistant that strictly answers questions based solely on the provided context retrieved from indexed documents.

Instructions:
1. Rely ONLY on the information given in the CONTEXT below.
2. If the context does not contain enough information to answer the question, honestly state: "Based on the provided documents, I do not have enough information to answer this question." Do NOT hallucinate or bring in external knowledge.
3. Be clear, precise, and concise in your explanation.
4. When stating facts, refer to the source document name if relevant.

CONTEXT:
${contextText}`;

    // 5. Query LLM with temperature 0.2
    const answer = await this.llmProvider.generateAnswer(
      systemPrompt,
      question,
      0.2,
    );

    return {
      question,
      answer,
      sources,
      modelUsed: this.modelName,
      timestamp: new Date().toISOString(),
    };
  }
}
