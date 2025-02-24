import { Module } from '@nestjs/common';
import { DietasController } from './dietas.controller';
import { DietasService } from './dietas.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DietasController],
  providers: [DietasService]
})
export class DietasModule {}
