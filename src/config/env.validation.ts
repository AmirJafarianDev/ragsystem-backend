import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum AiProviderType {
  GEMINI = 'gemini',
  OPENAI = 'openai',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  DATABASE_URL?: string;

  @IsString()
  @IsOptional()
  DB_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT: number = 5433;

  @IsString()
  @IsOptional()
  DB_USERNAME: string = 'postgres';

  @IsString()
  @IsOptional()
  DB_PASSWORD: string = 'postgres';

  @IsString()
  @IsOptional()
  DB_DATABASE: string = 'rag_db';

  @IsOptional()
  DB_SYNCHRONIZE: boolean = true;

  @IsEnum(AiProviderType)
  @IsOptional()
  AI_PROVIDER: AiProviderType = AiProviderType.GEMINI;

  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  GEMINI_EMBEDDING_MODEL: string = 'text-embedding-004';

  @IsString()
  @IsOptional()
  GEMINI_CHAT_MODEL: string = 'gemini-1.5-flash';

  @IsString()
  @IsOptional()
  OPENAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  OPENAI_EMBEDDING_MODEL: string = 'text-embedding-3-small';

  @IsString()
  @IsOptional()
  OPENAI_CHAT_MODEL: string = 'gpt-4o-mini';

  @IsInt()
  @IsOptional()
  VECTOR_DIMENSION: number = 768;

  @IsInt()
  @IsOptional()
  CHUNK_SIZE: number = 800;

  @IsInt()
  @IsOptional()
  CHUNK_OVERLAP: number = 100;

  @IsInt()
  @IsOptional()
  RAG_TOP_K: number = 4;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
