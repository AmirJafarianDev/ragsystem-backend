import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { validateEnv } from './config/env.validation';
import { VectorModule } from './modules/vector/vector.module';
import { DocumentModule } from './modules/document/document.module';
import { RagModule } from './modules/rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
      inject: [ConfigService],
    }),
    VectorModule,
    DocumentModule,
    RagModule,
  ],
})
export class AppModule {}
