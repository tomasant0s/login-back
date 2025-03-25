import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentStatusGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id; // Assumindo que o middleware de autenticação popula request.user

    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    // Se não houver pagamento aprovado, verifica a disponibilidade de tokens
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const tickets = user.tickets || 0;

    if (tickets > 0) {
      return true;
    }

    throw new UnauthorizedException('Pagamento não confirmado e sem tokens disponíveis para gerar a dieta');
  }
}
