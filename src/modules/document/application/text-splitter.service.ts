import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITextChunk } from '../domain/document-parser.interface';

@Injectable()
export class TextSplitterService {
  private readonly defaultChunkSize: number;
  private readonly defaultChunkOverlap: number;

  constructor(private readonly configService: ConfigService) {
    this.defaultChunkSize =
      this.configService.get<number>('app.chunkSize') || 800;
    this.defaultChunkOverlap =
      this.configService.get<number>('app.chunkOverlap') || 100;
  }

  splitText(
    text: string,
    chunkSize: number = this.defaultChunkSize,
    chunkOverlap: number = this.defaultChunkOverlap,
  ): ITextChunk[] {
    const cleanedText = text.replace(/\r\n/g, '\n').trim();
    if (!cleanedText) {
      return [];
    }

    if (cleanedText.length <= chunkSize) {
      return [{ content: cleanedText, chunkIndex: 0 }];
    }

    const chunks: ITextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < cleanedText.length) {
      let endIndex = startIndex + chunkSize;

      if (endIndex >= cleanedText.length) {
        const remaining = cleanedText.substring(startIndex).trim();
        if (remaining) {
          chunks.push({ content: remaining, chunkIndex });
        }
        break;
      }

      // Look for natural boundary (newline or space) near endIndex
      const slice = cleanedText.substring(startIndex, endIndex);
      let breakPoint = slice.lastIndexOf('\n');
      if (breakPoint === -1 || breakPoint < chunkSize * 0.6) {
        breakPoint = slice.lastIndexOf('. ');
      }
      if (breakPoint === -1 || breakPoint < chunkSize * 0.6) {
        breakPoint = slice.lastIndexOf(' ');
      }

      if (breakPoint > chunkSize * 0.5) {
        endIndex = startIndex + breakPoint;
      }

      const chunkContent = cleanedText.substring(startIndex, endIndex).trim();
      if (chunkContent) {
        chunks.push({
          content: chunkContent,
          chunkIndex,
        });
        chunkIndex++;
      }

      // Step forward taking overlap into account
      startIndex = Math.max(endIndex - chunkOverlap, startIndex + 1);
    }

    return chunks;
  }
}
