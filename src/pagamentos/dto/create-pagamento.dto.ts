import { IsDate, IsNotEmpty, IsString } from "class-validator"

  export class CreatePagamentoDto{
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsDate()
    @IsNotEmpty()
    processedAt: Date;

    @IsString()
    @IsNotEmpty()
    status: string;
  }