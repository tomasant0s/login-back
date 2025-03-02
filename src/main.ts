import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Ajuste os caminhos conforme sua estrutura. Aqui assumimos que o código compilado está em dist/
  // e os certificados estão um nível acima (na raiz do projeto).
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '../private.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certificate.crt')),
    ca: fs.existsSync(path.join(__dirname, '../ca_bundle.crt'))
      ? fs.readFileSync(path.join(__dirname, '../ca_bundle.crt'))
      : undefined,
  };

  // Cria a aplicação com as opções de HTTPS
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

  // Definindo a porta a partir da variável de ambiente ou utilizando 8080 como padrão
  const port = process.env.PORT || 8080;
  await app.listen(port);
  
  // Exibindo no console a porta onde o servidor está rodando
  console.log(`Servidor rodando na porta ${port}`);
}

bootstrap();
