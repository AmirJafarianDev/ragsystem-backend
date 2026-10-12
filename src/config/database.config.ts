import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    if (process.env.DATABASE_URL) {
      return {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        autoLoadEntities: true,
        synchronize: process.env.DB_SYNCHRONIZE !== 'false',
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
        extra: {
          max: 20,
        },
      };
    }

    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5433,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'rag_db',
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE !== 'false',
      logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
      extra: {
        max: 20,
      },
    };
  },
);
