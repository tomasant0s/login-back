import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DietaController } from './dietas.controller';
import { DietaService } from './dietas.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [HttpModule, PrismaModule, EmailModule],
  controllers: [DietaController],
  providers: [DietaService],
  exports: [DietaService],
})
export class DietaModule {}
