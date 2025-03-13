// diet-form-data.dto.ts
import { IsString } from 'class-validator';

export class DietFormDataDto {
  @IsString()
  peso: string;

  @IsString()
  altura: string;

  @IsString()
  idade: string;

  @IsString()
  objetivo: string;

  @IsString()
  calorias: string;

  @IsString()
  genero: string;
}

// menu-selections.dto.ts
import { IsArray } from 'class-validator';

export class MenuSelectionsDto {
  @IsArray()
  @IsString({ each: true })
  cafeDaManha: string[];

  @IsArray()
  @IsString({ each: true })
  almoco: string[];

  @IsArray()
  @IsString({ each: true })
  lanche: string[];

  @IsArray()
  @IsString({ each: true })
  janta: string[];
}

// training-data.dto.ts

export class TrainingDataDto {
  @IsString()
  nivelAtividade: string;

  @IsString()
  desejasTreino: string;
}

// additional-data.dto.ts

export class AdditionalDataDto {
  @IsString()
  horarioRefeicoes: string;

  @IsString()
  chocolateNaDieta: string;
}

// generate-diet.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

export class GenerateDietDto {
  @ValidateNested()
  @Type(() => DietFormDataDto)
  medidasForm: DietFormDataDto;

  @ValidateNested()
  @Type(() => MenuSelectionsDto)
  menuSelections: MenuSelectionsDto;

  @ValidateNested()
  @Type(() => TrainingDataDto)
  trainingData: TrainingDataDto;

  @ValidateNested()
  @Type(() => AdditionalDataDto)
  additionalData: AdditionalDataDto;
}
