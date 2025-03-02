import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '../private.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certificate.crt')),
    ca: fs.existsSync(path.join(__dirname, '../ca_bundle.crt'))
      ? fs.readFileSync(path.join(__dirname, '../ca_bundle.crt'))
      : undefined,
  };

  const app = await NestFactory.create(AppModule, { httpsOptions: sslOptions });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://main.d2p3f84def89hi.amplifyapp.com',
    ],
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);

  // Utilize o Logger do Nest para registrar a mensagem
  const logger = new Logger('Bootstrap');
  logger.log(`Servidor rodando na porta ${port}`);
}

bootstrap();
