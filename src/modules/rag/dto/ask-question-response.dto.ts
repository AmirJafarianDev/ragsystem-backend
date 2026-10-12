export interface SourceChunkDto {
  id?: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  distance?: number;
  similarityScore?: number;
}

export class AskQuestionResponseDto {
  question: string;
  answer: string;
  sources: SourceChunkDto[];
  modelUsed: string;
  timestamp: string;
}
