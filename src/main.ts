import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const sslOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'private.key')),
    cert: fs.readFileSync(path.join(process.cwd(), 'certificate.crt')),
    ca: fs.existsSync(path.join(process.cwd(), 'ca_bundle.crt'))
      ? fs.readFileSync(path.join(process.cwd(), 'ca_bundle.crt'))
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
      'https://login-delta-blue.vercel.app',
    ],
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);

  // Utilize o Logger do Nest para registrar a mensagem
  const logger = new Logger('Bootstrap');
  logger.log(`Servidor rodando na porta ${port}`);
  logger.log(process.cwd())
}

bootstrap();
