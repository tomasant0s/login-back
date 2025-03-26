import { Controller, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerateDietDto } from './dto/generate-dieta.dto';
import { DietaService } from './dietas.service';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

@Controller('dieta')
export class DietaController {
  constructor(
    private readonly dietService: DietaService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('/:userId')
  async generateDiet(
    @Param('userId') userId: string,
    // Agora o corpo da requisição recebe também os campos "paymentAmount" e "addOrderBump"
    @Body() userData: GenerateDietDto & { paymentAmount?: string; addOrderBump?: boolean }
  ) {
    // 1. Atualiza os dados do usuário com as medidas (a partir do medidasForm)
    const { medidasForm } = userData;
    console.log(userData);
    const imc = Math.floor(
      Number(medidasForm.peso) / (Number(medidasForm.altura) * Number(medidasForm.altura))
    );
    const updateData: UpdateUserDto = {
      altura: medidasForm.altura,
      peso: medidasForm.peso,
      imc,
      prompt: medidasForm.objetivo,
      lastLogin: new Date(),
    };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 2. Verifica a disponibilidade de tokens
    const tickets = updatedUser.tickets || 0;
    const ticketsUsados = updatedUser.ticketsUsados || 0;
    if (tickets <= 0) {
      return { message: "Dados atualizados. Prossiga para a página de planos/pagamento para gerar a dieta." };
    }

    // 3. Recupera o valor do pagamento ou usa "default"
    const paymentAmount: string = userData.paymentAmount || "default";

    // 4. Chama o método do serviço de dieta, repassando também o valor de addOrderBump
    const dietUser = await this.dietService.processDietGeneration(
      userId,
      userData,
      paymentAmount,
      updatedUser.email,
      userData.addOrderBump
    );

    // 5. Desconta 1 token do usuário
    await this.prisma.user.update({
      where: { id: userId },
      data: { ticketsUsados: ticketsUsados + 1 , tickets: tickets - 1},
    });

    return { dieta: dietUser.dieta || dietUser.message };
  }
}
