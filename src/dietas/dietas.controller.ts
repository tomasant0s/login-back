import { Controller, Post, Body, Param } from '@nestjs/common';
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
    @Body() userData: GenerateDietDto, // Agora estamos usando o DTO
  ) {
    // 1. Atualiza os dados do usuário com as medidas (a partir do medidasForm)
    const { medidasForm } = userData;
    console.log(userData)
    const imc = Math.floor(
      Number(medidasForm.peso) /
      (Number(medidasForm.altura) * Number(medidasForm.altura))
    );
    const updateData: UpdateUserDto = {
      altura: medidasForm.altura,
      peso: medidasForm.peso,
      imc,
      prompt: medidasForm.objetivo, // ou outro campo, conforme sua necessidade
      lastLogin: new Date(),
    };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 2. Verifica a disponibilidade de tokens
    // const tickets = updatedUser.tickets || 0;
    // const ticketsUsados = updatedUser.ticketsUsados || 0;
    // const tokensDisponiveis = tickets - ticketsUsados;

    // if (tokensDisponiveis <= 0) {
    //   return { message: "Dados atualizados. Prossiga para a página de planos/pagamento para gerar a dieta." };
    // }

    // 3. Se houver tokens, gera a dieta e desconta 1 token
    const dietUser = await this.dietService.generateAndSaveDiet(userId, userData);

    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     ticketsUsados: ticketsUsados + 1,
    //   },
    // });

    return { dieta: dietUser.dieta };
  }
}
