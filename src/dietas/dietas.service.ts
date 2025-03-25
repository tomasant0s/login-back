import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateDietDto } from './dto/generate-dieta.dto';
import { createPDF, createPDFs } from '../services/pdfs/pdfs.service';
import { textCreatina, textWhey, textFrutas, receitasFit } from '../services/pdfs/text';
import { EmailService } from '../email/email.service';

@Injectable()
export class DietaService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  getExerciseFactor(nivelAtividade: string): number {
    return Number(nivelAtividade) || 1.2;
  }

  calcularCalorias(objetivo: string, genero: string, homensTMB: number, mulheresTMB: number): string {
    switch (objetivo) {
      case "Emagrecimento com facilidade":
        return genero === 'Masculino'
          ? `${homensTMB - 700} a ${homensTMB - 500}`
          : `${mulheresTMB - 700} a ${mulheresTMB - 500}`;
      case "Emagrecimento com facilidade + ganho de massa":
        return genero === 'Masculino'
          ? `${homensTMB - 400} a ${homensTMB - 200}`
          : `${mulheresTMB - 400} a ${mulheresTMB - 300}`;
      case "Jejum Intermitente":
        return genero === 'Masculino'
          ? `${homensTMB - 600} a ${homensTMB - 500}`
          : `${mulheresTMB - 600} a ${mulheresTMB - 500}`;
      case "Definição Muscular":
        return genero === 'Masculino'
          ? `${homensTMB - 300} a ${homensTMB - 200}`
          : `${mulheresTMB - 300} a ${mulheresTMB - 200}`;
      case "Bulking":
        return genero === 'Masculino'
          ? `${homensTMB + 500} a ${homensTMB + 600}`
          : `${mulheresTMB + 500} a ${mulheresTMB + 600}`;
      case "Definição e ganho de Massa Muscular":
        return genero === 'Masculino'
          ? `${homensTMB + 200} a ${homensTMB + 400}`
          : `${mulheresTMB + 200} a ${mulheresTMB + 400}`;
      default:
        return genero === 'Masculino'
          ? `${homensTMB - 100} a ${homensTMB + 100}`
          : `${mulheresTMB - 100} a ${mulheresTMB + 100}`;
    }
  }

  buildPrompt(userData: GenerateDietDto): string {
    const { medidasForm, menuSelections, trainingData, additionalData } = userData;
    const { peso, altura, idade, objetivo, calorias, genero } = medidasForm;
    const { cafeDaManha, lanche, almoco, janta } = menuSelections;
    const { nivelAtividade } = trainingData;
    const { horarioRefeicoes, chocolateNaDieta } = additionalData;

    const weight = Number(peso);
    const heightNum = Number(altura);
    const ageNum = Number(idade);

    const exercicio = this.getExerciseFactor(nivelAtividade);
    const homensTMB = Math.floor((10 * weight + 6.25 * (heightNum * 100) - 5 * ageNum + 5) * exercicio);
    const mulheresTMB = Math.floor((10 * weight + 6.25 * (heightNum * 100) - 5 * ageNum - 161) * exercicio);

    const metaCalorias = calorias === 'Não'
      ? this.calcularCalorias(objetivo, genero, homensTMB, mulheresTMB)
      : calorias;

    const [min, max] = metaCalorias.split(" a ").map(Number);
    const valores: number[] = [];
    for (let i = min; i <= max; i += 100) {
      valores.push(i);
    }
    const sorteado = valores[Math.floor(Math.random() * valores.length)];

    const prompt = `
Crie um plano de dieta exclusivo para atingir o objetivo de ${objetivo} com um total de ${sorteado} kcal diárias para uma pessoa de ${weight}kg e ${heightNum}m.
Siga as seguintes diretrizes:
1. Apresente o total de calorias ao final de cada refeição, sem detalhar as calorias de cada alimento.
2. Utilize apenas os alimentos listados para cada refeição:
   - Café da manhã: Meta 20% de ${sorteado} kcal: ${cafeDaManha.join(", ")}
   - Lanche da manhã: Meta 15% de ${sorteado} kcal: ${lanche.join(", ")}
   - Almoço: Meta 25% de ${sorteado} kcal: ${almoco.join(", ")}
   - Lanche da tarde: Meta 15% de ${sorteado} kcal: ${lanche.join(", ")}
   - Jantar: Meta 25% de ${sorteado} kcal: ${janta.join(", ")}
3. Certifique-se de que o total das refeições some exatamente ${sorteado} kcal.
4. Para o almoço, inclua combinações de carboidrato, proteína e legumes; para almoço e jantar, siga a proporção de 60% carboidratos, 30% proteínas e 10% legumes. Se "Arroz" for mencionado, inclua-o em todas as opções.
5. Utilize os horários indicados para as refeições: ${horarioRefeicoes}. Após a última refeição, inclua ${chocolateNaDieta}.
6. Ajuste as quantidades dos alimentos em gramas para que cada refeição corresponda exatamente à meta calórica.
7. Apresente cada refeição em uma linha separada.
8. Retorne a resposta em formato JSON com as seguintes chaves: 
   - "cafeManha": uma única string contendo as 3 opções para o café da manhã e suas respectivas calorias;
   - "almoco": uma única string contendo as 3 opções para o almoço;
   - "lanche": uma única string contendo as 3 opções para o lanche (usada para lanche da manhã e lanche da tarde);
   - "janta": uma única string contendo as 3 opções para o jantar;
   - "horarios": uma string com os horários das refeições.
Finalize o plano sem mensagens extras após o jantar.
    `;
    return prompt;
  }

  async getDiet(userData: GenerateDietDto): Promise<any> {
    const prompt = this.buildPrompt(userData);
    const systemMessage = `1 - Todas as refeições devem ser estruturadas para somar corretamente as calorias diárias desejadas.
2 - Cada refeição terá 3 opções que seja possível fazer e o total de calorias de cada refeição deve ser exatamente igual à meta desejada.
3 - Distribua as calorias corretamente entre as refeições (café da manhã, lanche da manhã, almoço, lanche da tarde e jantar), com quantidades exatas por refeição especificada;
4 - Inclua as porções dos alimentos em gramas para facilitar o cálculo de calorias. Para as frutas, não inclua Kiwi; para suco natural, não inclua Kiwi e maçã.
5 - Mantenha um tom profissional de nutricionista e seja objetivo na resposta.
6 - As quantidades dos alimentos devem ser ajustadas com precisão para que o total de calorias de cada refeição corresponda exatamente à meta calórica. Não inclua estimativas ou sugestões de ajustes futuros. O valor calórico final de cada refeição deve estar 100% correto.
7 - Formate a dieta em Café da Manhã: *Opção 1:* *Opção 2:* *Opção 3:* e assim sucessivamente para lanche da manhã, almoço, lanche da tarde e jantar.
8 - Coloque apenas 1 tipo de carboidrato na opção de almoço e jantar.
`;
    const url = 'https://api.openai.com/v1/chat/completions';
    const data = {
      model: "gpt-4-turbo-2024-04-09",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ]
    };
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    };
    try {
      const response = await lastValueFrom(this.httpService.post(url, data, { headers }));
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException('Erro ao gerar a dieta');
    }
  }

  /**
   * Método que integra as lógicas de pós-pagamento com base no valor do pagamento.
   * @param userId - ID do usuário
   * @param dietData - Dados da dieta fornecidos pelo usuário (GenerateDietDto)
   * @param paymentAmount - Valor do pagamento (ex.: "1.99", "29.99" ou "default")
   * @param userEmail - Email do usuário para envio das mensagens
   */
  async processDietGeneration(userId: string, dietData: GenerateDietDto, paymentAmount: string, userEmail: string): Promise<any> {
    if (paymentAmount === "1.99") {
      // Fluxo para 1.99: Geração de PDFs e envio de e-mail
      const userData = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { dieta: true },
      });
      if (!userData) {
        throw new InternalServerErrorException('Usuário não encontrado');
      }
      const peso = Number(userData.peso || 70);
      const altura = Number(userData.altura || 1.75);
      const IMC = peso / (altura * altura);

      const pdfDietaBuffer = await createPDF(peso, altura, IMC, userData.dieta || '');
      const pdfBuffer = await createPDFs(textCreatina, process.env.IMG_CREATINA || '');
      const pdfBuffer2 = await createPDFs(textWhey, process.env.IMG_WHEY || '');
      const pdfBuffer3 = await createPDFs(receitasFit, process.env.IMG_PIZZA || '');
      const pdfBuffer4 = await createPDFs(textFrutas, process.env.IMG_FRUTAS || '');

      await this.emailService.sendEmail(
        userEmail,
        'Pagamento Aprovado - Seu Plano Alimentar',
        `<p>Seu pagamento foi aprovado e sua dieta foi atualizada.</p>`,
        [
          { filename: 'Dieta.pdf', content: pdfDietaBuffer, contentType: 'application/pdf' },
          { filename: 'RecomendaçõesCreatina.pdf', content: pdfBuffer, contentType: 'application/pdf' },
          { filename: 'RecomendaçõesWhey.pdf', content: pdfBuffer2, contentType: 'application/pdf' },
          { filename: 'ReceitasFit.pdf', content: pdfBuffer3, contentType: 'application/pdf' },
          { filename: 'RecomendaçõesFrutas.pdf', content: pdfBuffer4, contentType: 'application/pdf' },
        ]
      );
      return { message: 'Diet PDFs generated and email sent for payment amount 1.99' };
    } else if (paymentAmount === "29.99") {
      // Fluxo para 29.99: Atualiza campo nutricionistaPersonalizado e envia e-mail com WhatsApp
      await this.prisma.user.update({
        where: { id: userId },
        data: { nutricionistaPersonalizado: 2 },
      });
      const numeroWhatsApp = this.generateWhatsAppNumber();
      const mensagem = `<p>Aqui está seu plano alimentar em PDF. 💚</p>
        <p>Entre em contato pelo WhatsApp para agendar sua consulta com nossa nutricionista:</p>
        <p><a href="https://wa.me/${numeroWhatsApp}" target="_blank">Clique aqui para enviar uma mensagem</a></p>
        <p>Atenciosamente,</p>
        <p>Equipe de Suporte - Nutri Inteligente</p>`;
      await this.emailService.sendEmail(
        userEmail,
        'Pagamento Acompanhado - Entre em Contato',
        mensagem
      );
      return { message: 'Email with WhatsApp contact sent for payment amount 29.99' };
    } else {
      // Fluxo padrão para outros valores: Geração de dieta via OpenAI e salvamento no banco
      const dietResponse = await this.getDiet(dietData);
      const responseContent = dietResponse.choices?.[0]?.message?.content;
      if (!responseContent) {
        throw new InternalServerErrorException('A dieta não foi gerada corretamente');
      }

      let parsedDiet;
      try {
        let cleanedResponse = responseContent;
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.slice(7);
          const closingIndex = cleanedResponse.lastIndexOf('```');
          if (closingIndex !== -1) {
            cleanedResponse = cleanedResponse.slice(0, closingIndex);
          }
        }
        cleanedResponse = cleanedResponse.trim();
        const jsonMatch = cleanedResponse.match(/{[\s\S]*}/);
        if (!jsonMatch) {
          throw new Error('JSON não encontrado na resposta');
        }
        const jsonString = jsonMatch[0];
        parsedDiet = JSON.parse(jsonString);
      } catch (error) {
        throw new InternalServerErrorException('Erro ao interpretar a dieta gerada');
      }

      const requiredKeys = ['cafeManha', 'almoco', 'lanche', 'janta', 'horarios'];
      for (const key of requiredKeys) {
        if (!parsedDiet[key]) {
          throw new InternalServerErrorException(`A chave ${key} está ausente na resposta`);
        }
      }

      const snack = parsedDiet.lanche;
      const dietaData = {
        cafeManha: parsedDiet.cafeManha,
        lancheManha: snack,
        almoco: parsedDiet.almoco,
        lancheTarde: snack,
        janta: parsedDiet.janta,
        horarios: parsedDiet.horarios,
      };

      try {
        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: {
            dieta: {
              upsert: {
                update: dietaData,
                create: dietaData,
              },
            },
          },
          include: { dieta: true },
        });
        return updatedUser;
      } catch (error) {
        throw new InternalServerErrorException('Erro ao salvar a dieta');
      }
    }
  }

  async generateAndSaveDiet(userId: string, userData: GenerateDietDto): Promise<any> {
    // Método antigo para compatibilidade, redirecionado para o fluxo default
    return this.processDietGeneration(userId, userData, "default", "");
  }

  private generateWhatsAppNumber(): string {
    const numeros = ['5524993329513', '5524993288136'];
    const indiceAleatorio = Math.floor(Math.random() * numeros.length);
    return numeros[indiceAleatorio];
  }
}
