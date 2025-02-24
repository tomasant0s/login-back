import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';

@Controller('pagamentos')
export class PagamentosController {
    constructor(private readonly pagamentoService: PagamentosService) {}
    
        @Get()
        findAllPagamentos(){
            return
        }
    
        @Get('/:id')
        findOnePagamento(@Param('id') id: string){
            return
        }
    
        @Post()
        createPagamento(@Body() createPagamentoDto: CreatePagamentoDto){
            return
        }
    
        @Delete()
        deletePagamento(@Param('id') id:string){
            return
        }
}
