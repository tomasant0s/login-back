import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDto{
    @IsEmail()
    @IsNotEmpty()
    @MinLength(5)
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    telefone: string;

    @IsInt()
    @IsOptional()
    tickets: number;

    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    senha: string;

}