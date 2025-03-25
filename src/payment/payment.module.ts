import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from 'src/email/email.module';
import { DietaModule } from 'src/dietas/dietas.module';

@Module({
  imports: [PrismaModule, EmailModule, DietaModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
