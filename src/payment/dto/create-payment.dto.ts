  import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';

  export class CreatePaymentDto {
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    uid: string;

    @IsBoolean()
    @IsOptional()
    addOrderBump?: boolean;

    @IsString()
    @IsOptional()
    userAgent?: string;

    @IsString()
    @IsOptional()
    ip?: string;

    @IsString()
    @IsOptional()
    fbp?: string;

    @IsString()
    @IsOptional()
    fbc?: string;
  }
