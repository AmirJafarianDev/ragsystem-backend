import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorModule } from '../vector/vector.module';
import { DocumentParserService } from './application/document-parser.service';
import { TextSplitterService } from './application/text-splitter.service';
import { DocumentIngestionService } from './application/document-ingestion.service';
import { DocumentController } from './infrastructure/document.controller';

@Module({
  imports: [ConfigModule, VectorModule],
  controllers: [DocumentController],
  providers: [
    DocumentParserService,
    TextSplitterService,
    DocumentIngestionService,
  ],
  exports: [DocumentIngestionService],
})
export class DocumentModule {}
