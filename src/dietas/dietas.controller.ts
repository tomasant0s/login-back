import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DietasService } from './dietas.service';
import { CreateDietaDto } from './dto/create-dieta.dto';
import { UpdateDietaDto } from './dto/update-dieta.dto';

@Controller('dietas')
export class DietasController {
    constructor(private readonly dietaService: DietasService) {}
    
        @Get()
        findAllDietas(){
            return
        }
    
        @Get('/:id')
        findOneDieta(@Param('id') id: string){
            return
        }
    
        @Post()
        createDieta(@Body() createDietaDto: CreateDietaDto){
            return
        }
    
        @Patch()
        updateDieta(@Param('id') id: string, @Body() updateDietaDto: UpdateDietaDto){
            return
        }
    
        @Delete()
        deleteDieta(@Param('id') id:string){
            return
        }
}
