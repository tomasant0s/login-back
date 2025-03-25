import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { DietaModule } from 'src/dietas/dietas.module';
import { PaymentModule } from 'src/payment/payment.module';
import { EmailModule } from 'src/email/email.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UsersModule,
    DietaModule,
    PaymentModule,
    EmailModule,
    PrismaModule,
    WebsocketModule, // opcional, se você for usar notificações em tempo real
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
