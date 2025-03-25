import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { efipay } from '../services/EFIPayment';
import { AsaasService } from '../services/asaas/asaas.service';
import { EmailService } from '../email/email.service';
import { createPDF, createPDFs } from '../services/pdfs/pdfs.service';
import { textCreatina, textWhey, textFrutas, receitasFit } from '../services/pdfs/text';
import { DietaService } from 'src/dietas/dietas.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private asaasService: AsaasService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly dietaService: DietaService,
  ) {
    // Inicializa o serviço Asaas usando a variável ASAAS_ACCESS_TOKEN
    this.asaasService = new AsaasService();
  }

  async processPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
    try {
      // Tenta Efipay primeiro
      const chargeInput = {
        calendario: { expiracao: 1800 },
        valor: { original: createPaymentDto.amount.toString() },
        infoAdicionais: [
          { nome: 'user_agent', valor: createPaymentDto.userAgent || '' },
          { nome: 'ip', valor: createPaymentDto.ip || '' },
          { nome: 'fbp', valor: createPaymentDto.fbp || '' },
          { nome: 'fbc', valor: createPaymentDto.fbc || '' },
        ],
        chave: process.env.EFI_PAY_CHAVE || '',
        solicitacaoPagador: createPaymentDto.uid,
      };

      const efipayResponse = await efipay.pixCreateImmediateCharge({}, chargeInput);

      // Cria o registro de pagamento com o status retornado (por exemplo, "ATIVA")
      await this.prisma.pagamento.create({
        data: {
          id: efipayResponse.txid,
          processedAt: new Date(),
          status: efipayResponse.status,
          user: { connect: { id: createPaymentDto.uid! } },
        },
      });

      // Não incrementa ticket aqui, pois o incremento ocorrerá via webhook somente após a confirmação

      // Atualiza o campo lastLogin do usuário
      await this.prisma.user.update({
        where: { id: createPaymentDto.uid },
        data: { lastLogin: new Date() },
      });

      this.logger.log(`Pagamento ${efipayResponse.txid} criado com status ${efipayResponse.status}`);
      return efipayResponse;
    } catch (error) {
      this.logger.error('Erro com Efipay, tentando Asaas', error);
      // Fallback para Asaas
      try {
        const payload = {
          addressKey: process.env.ASAAS_ACCESS_TOKEN || '',
          description: createPaymentDto.fbp || '',
          value: createPaymentDto.amount,
          format: 'PAYLOAD',
          allowsMultiplePayments: false,
          expirationSeconds: 1800,
          externalReference: `${createPaymentDto.email}/${createPaymentDto.uid}`,
        };

        const asaasResponse = await this.asaasService.createPixPayment(payload);
        const generatedId = `NUTRIINT${Date.now()}ASA`;
        const userId = createPaymentDto.uid;

        await this.prisma.pagamento.create({
          data: {
            id: generatedId,
            processedAt: new Date(),
            user: { connect: { id: userId } },
            status: "pendente",
          },
        });

        // Não incrementa ticket aqui; isso será feito via webhook Asaas após confirmação

        await this.prisma.user.update({
          where: { id: createPaymentDto.uid },
          data: { lastLogin: new Date() },
        });

        this.logger.log(`Pagamento fallback (Asaas) criado com ID ${generatedId}`);
        return asaasResponse;
      } catch (asaasError) {
        this.logger.error('Erro com Asaas', asaasError);
        throw new HttpException('Erro ao processar pagamento', HttpStatus.BAD_REQUEST);
      }
    }
  }

 async processEfiWebhookPix(body: any): Promise<any> {
  try {
    this.logger.log('🔔 Webhook da Efipay recebido:', JSON.stringify(body, null, 2));

    this.logger.log('🔔 Webhook do Efipay recebido: ' + JSON.stringify(body, null, 2));
    const txid = body.pix[0].txid;
    this.logger.debug(`txid recebido: ${txid}`);

    const chargeDetails = await efipay.pixDetailCharge({ txid });
    
    this.logger.debug(`Detalhes da cobrança: ${JSON.stringify(chargeDetails)}`);

    // Normaliza o status para garantir consistência na comparação
    const statusNormalizado = chargeDetails.status.toUpperCase().trim();
    this.logger.debug(`Status normalizado: ${statusNormalizado}`);

    const existingPayment = await this.prisma.pagamento.findUnique({ where: { id: txid } });
    if (existingPayment) {
      await this.prisma.pagamento.update({
        where: { id: txid },
        data: { status: statusNormalizado, processedAt: new Date() },
      });
      this.logger.log(`✅ Pagamento ${txid} atualizado para ${statusNormalizado} no banco.`);
    } else {
      await this.prisma.pagamento.create({
        data: {
          id: txid,
          processedAt: new Date(),
          status: statusNormalizado,
          user: { connect: { id: chargeDetails.solicitacaoPagador } },
        },
      });
      this.logger.log(`✅ Pagamento ${txid} criado com status ${statusNormalizado} no banco.`);
    }

    // Atualiza o lastLogin do usuário
    await this.prisma.user.update({
      where: { id: chargeDetails.solicitacaoPagador },
      data: { lastLogin: new Date() },
    });

    // Se o pagamento foi concluído, incrementa o ticket
    if (statusNormalizado === 'CONCLUIDA') {
      await this.prisma.user.update({
        where: { id: chargeDetails.solicitacaoPagador },
        data: { tickets: { increment: 1 } },
      });
      this.logger.log(`Pagamento ${txid} concluído. Ticket incrementado. Valor: ${chargeDetails.valor.original}`);
      return { message: 'Webhook processado com sucesso', valor: chargeDetails.valor.original };
    } else {
      return { message: 'Pagamento não concluído' };
    }
  } catch (error) {
    this.logger.error('Erro no processEfiWebhookPix', error);
    throw new HttpException('Erro ao processar webhook Efipay', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
  async processAsaasWebhook(body: any): Promise<any> {
    try {
      this.logger.log('🔔 Webhook Asaas recebido: ' + JSON.stringify(body, null, 2));
      // Supondo que o payload do Asaas contenha "id", "status", "externalReference" e "value"
      const paymentId = body.id;
      const status = body.status;
      const externalReference = body.externalReference; // Exemplo: "email/userId"
      const parts = externalReference.split('/');
      const userId = parts[1];

      const existingPayment = await this.prisma.pagamento.findUnique({ where: { id: paymentId } });
      if (existingPayment) {
        await this.prisma.pagamento.update({
          where: { id: paymentId },
          data: { status, processedAt: new Date() },
        });
        this.logger.log(`✅ Pagamento Asaas ${paymentId} atualizado para ${status}.`);
      } else {
        await this.prisma.pagamento.create({
          data: {
            id: paymentId,
            processedAt: new Date(),
            status,
            user: { connect: { id: userId } },
          },
        });
        this.logger.log(`✅ Pagamento Asaas ${paymentId} criado com status ${status}.`);
      }

      // Atualiza lastLogin do usuário
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() },
      });

      // Se o pagamento for concluído, incrementa o ticket e retorna o valor
      if (status === 'CONCLUIDA') {
        await this.prisma.user.update({
          where: { id: userId },
          data: { tickets: { increment: 1 } },
        });
        this.logger.log(`Pagamento Asaas ${paymentId} concluído. Ticket incrementado. Valor: ${body.value}`);
        return { message: 'Webhook Asaas processado com sucesso', valor: body.value };
      } else {
        return { message: 'Pagamento Asaas não concluído' };
      }
    } catch (error) {
      this.logger.error('Erro no webhook Asaas', error);
      throw new HttpException('Erro ao processar webhook Asaas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPaymentStatus(id: string): Promise<any> {
    const payment = await this.prisma.pagamento.findUnique({ where: { id } });
    this.logger.log('Consulta de status de pagamento: ' + JSON.stringify(payment));
    if (!payment) {
      throw new HttpException('Pagamento não encontrado', HttpStatus.NOT_FOUND);
    }
    return payment;
  }

  async cancelPayment(paymentId: string): Promise<any> {
    try {
      if (!/^[a-zA-Z0-9]{26,35}$/.test(paymentId)) {
        throw new HttpException('txid inválido', HttpStatus.BAD_REQUEST);
      }
      const currentCharge = await efipay.pixDetailCharge({ txid: paymentId });
      this.logger.debug(`Status atual da cobrança no Efipay: ${currentCharge.status}`);

      if (currentCharge.status !== 'ATIVA') {
        this.logger.warn(
          `Tentativa de cancelamento para pagamento ${paymentId} com status ${currentCharge.status}. Cancelamento permitido apenas para cobranças ATIVA.`,
        );
        throw new HttpException('A cobrança não está ativa e não pode ser cancelada', HttpStatus.BAD_REQUEST);
      }

      const chargeInput = { txid: paymentId };
      const updateInput: any = { status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR' };
      const response = await efipay.pixUpdateCharge(chargeInput, updateInput);

      await this.prisma.pagamento.update({
        where: { id: paymentId },
        data: { status: response.status },
      });

      this.logger.log(`✅ Pagamento ${paymentId} cancelado com sucesso.`);
      return response;
    } catch (error) {
      this.logger.error('Erro no cancelPayment', error);
      throw new HttpException('Erro ao cancelar pagamento', HttpStatus.BAD_REQUEST);
    }
  }
}
