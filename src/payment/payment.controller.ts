import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CancelPaymentDto } from './dto/cancel-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('process')
  async processPayment(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      const response = await this.paymentService.processPayment(createPaymentDto);
      return response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao processar pagamento',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('webhook/efi/pix')
  async processEfiWebhookPix(@Body() body: any) {
    try {
      const response = await this.paymentService.processEfiWebhookPix(body);
      return response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro no webhook Efipay',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status/:id')
  async getPaymentStatus(@Param('id') id: string) {
    try {
      const status = await this.paymentService.getPaymentStatus(id);
      return status;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao obter status de pagamento',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('cancel')
  async cancelPayment(@Body() cancelPaymentDto: CancelPaymentDto) {
    try {
      const response = await this.paymentService.cancelPayment(cancelPaymentDto.paymentId);
      return response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao cancelar pagamento',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
