import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerateDietDto } from './dto/generate-dieta.dto';

@Injectable()
export class DietaService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  // Retorna o fator de exercício com base no nível de atividade
  getExerciseFactor(nivelAtividade: string): number {
    const factors: Record<string, number> = {
      leve: 1.2,
      moderado: 1.55,
      intenso: 1.9,
    };
    return factors[nivelAtividade.toLowerCase()] || 1.2;
  }

  // Calcula a meta calórica com base no objetivo e TMB (Taxa Metabólica Basal)
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

  // Monta o prompt a ser enviado ao ChatGPT usando os dados do GenerateDietDto  
  buildPrompt(userData: GenerateDietDto): string {
    const { medidasForm, menuSelections, trainingData, additionalData } = userData;
    const { peso, altura, idade, objetivo, calorias, genero } = medidasForm;
    // Usa um único array "lanche" para ambos os lanches
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
    console.log('valores:', valores);
    console.log('sorteado:', sorteado);

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

  // Chama a API do ChatGPT utilizando o prompt montado
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
      console.error('Erro ao chamar a API do ChatGPT:', error);
      throw new InternalServerErrorException('Erro ao gerar a dieta');
    }
  }

  // Gera a dieta, faz o parse da resposta e atualiza (ou cria) a dieta associada ao usuário via Prisma  
  async generateAndSaveDiet(userId: string, userData: GenerateDietDto): Promise<any> {
    const dietResponse = await this.getDiet(userData);
    const responseContent = dietResponse.choices?.[0]?.message?.content;
    if (!responseContent) {
      throw new InternalServerErrorException('A dieta não foi gerada corretamente');
    }

    console.dir(responseContent, { maxArrayLength: null, depth: null });

    let parsedDiet;
    try {
      // Remove delimitadores de markdown se presentes (ex: ```json ... ```)
      let cleanedResponse = responseContent;
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
        const closingIndex = cleanedResponse.lastIndexOf('```');
        if (closingIndex !== -1) {
          cleanedResponse = cleanedResponse.slice(0, closingIndex);
        }
      }
      cleanedResponse = cleanedResponse.trim();

      // Extrai o JSON usando expressão regular
      const jsonMatch = cleanedResponse.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      const jsonString = jsonMatch[0];
      parsedDiet = JSON.parse(jsonString);
    } catch (error) {
      console.error('Erro ao parsear o JSON da dieta:', error);
      throw new InternalServerErrorException('Erro ao interpretar a dieta gerada');
    }

    // Verifica se as chaves necessárias estão presentes
    const requiredKeys = ['cafeManha', 'almoco', 'lanche', 'janta', 'horarios'];
    for (const key of requiredKeys) {
      if (!parsedDiet[key]) {
        throw new InternalServerErrorException(`A chave ${key} está ausente na resposta`);
      }
    }

    // Mapeia o valor retornado de "lanche" para preencher ambos os campos "lancheManha" e "lancheTarde"
    const snack = parsedDiet.lanche;

    // Cria um objeto apenas com os campos esperados pelo Prisma
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
      console.error('Erro ao salvar a dieta no banco:', error);
      throw new InternalServerErrorException('Erro ao salvar a dieta');
    }
  }
}
