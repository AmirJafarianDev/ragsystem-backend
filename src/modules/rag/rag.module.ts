import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VectorModule } from '../vector/vector.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { LLM_CHAT_PROVIDER } from './domain/llm-provider.interface';
import { GoogleGeminiChatProvider } from './infrastructure/providers/google-gemini-chat.provider';
import { OpenAIChatProvider } from './infrastructure/providers/openai-chat.provider';

@Module({
  imports: [ConfigModule, VectorModule],
  controllers: [RagController],
  providers: [
    RagService,
    {
      provide: LLM_CHAT_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('app.aiProvider');
        if (provider === 'openai') {
          return new OpenAIChatProvider(configService);
        }
        return new GoogleGeminiChatProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [RagService],
})
export class RagModule {}
