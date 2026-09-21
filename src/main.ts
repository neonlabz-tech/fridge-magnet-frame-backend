import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setServers } from 'node:dns';

async function bootstrap() {
  setServers(['1.1.1.1', '8.8.8.8']);

  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    'https://admin.magnifycreation.lk',
    'https://magnifycreation.lk',
    'https://www.magnifycreation.lk',
    'https://www.admin.magnifycreation.lk',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT || 4000);
}
bootstrap();


