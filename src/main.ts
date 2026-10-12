import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  // Global pipes, filters and interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enable CORS
  app.enableCors({ origin: '*' });

  // Root health endpoint for cloud hosting checks (Render/Railway/AWS)
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.json({ status: 'ok', service: 'RAG Backend API', version: '1.0.0' });
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 RAG Application running on: http://0.0.0.0:${port}`);
  logger.log(
    `AI Provider: ${configService.get<string>('app.aiProvider')} | Dimension: ${configService.get<number>('app.vectorDimension')}`,
  );
}

bootstrap();
