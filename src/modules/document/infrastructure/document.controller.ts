import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentIngestionService } from '../application/document-ingestion.service';

@Controller('api/documents')
export class DocumentController {
  constructor(
    private readonly ingestionService: DocumentIngestionService,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB limit
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.ingestionService.processAndIngestDocument(file);
  }
}
