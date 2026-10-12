export interface ParsedDocument {
  name: string;
  text: string;
}

export interface ITextChunk {
  content: string;
  chunkIndex: number;
}
