import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }))
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://main.d2p3f84def89hi.amplifyapp.com'
    ]
  });
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
