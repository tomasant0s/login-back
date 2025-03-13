import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DietaController } from './dietas.controller';
import { DietaService } from './dietas.service';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [DietaController],
  providers: [DietaService],
})
export class DietaModule {}
