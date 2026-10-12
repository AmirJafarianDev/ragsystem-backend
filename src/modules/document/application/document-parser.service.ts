import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  async parseFile(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is missing or empty.');
    }

    const mimeType = file.mimetype;
    const fileName = file.originalname.toLowerCase();

    this.logger.log(`Parsing file: ${file.originalname} (${mimeType})`);

    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      try {
        const data = await pdfParse(file.buffer);
        return this.cleanExtractedText(data.text || '');
      } catch (error) {
        this.logger.error(`Failed to parse PDF: ${error.message}`);
        throw new BadRequestException(`Could not extract text from PDF: ${error.message}`);
      }
    }

    if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.csv')
    ) {
      return this.cleanExtractedText(file.buffer.toString('utf-8'));
    }

    throw new BadRequestException(
      `Unsupported file type "${mimeType}". Only PDF and plain text files (.txt, .md, .csv) are supported.`,
    );
  }

  cleanExtractedText(text: string): string {
    if (!text) return '';
    let t = text.replace(/\r\n/g, '\n').replace(/ي/g, 'ی').replace(/ك/g, 'ک');

    // Persian connecting letters that connect forward
    const connectingChars = 'بپتثجچحخسشصضطظعغفقکگلمنهیئ';
    const regex = new RegExp(`([${connectingChars}])\\s+([آابپتثجچحخسشصضطظعغفقکگلمنوهیئ])`, 'g');

    let prev = '';
    let iterations = 0;
    while (prev !== t && iterations < 8) {
      prev = t;
      t = t.replace(regex, '$1$2');
      iterations++;
    }

    // Collapse multiple horizontal spaces to single space
    t = t.replace(/[ \t]+/g, ' ');
    return t;
  }
}
