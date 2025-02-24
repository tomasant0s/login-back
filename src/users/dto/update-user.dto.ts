import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { IsDate, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateUserDto extends PartialType(CreateUserDto){
    @IsString()
    @IsOptional()
    altura: string;

    @IsString()
    @IsOptional()
    peso: string;

    @IsInt()
    @IsOptional()
    imc: number;

    @IsInt()
    @IsOptional()
    ticketsUsados: number;

    @IsString()
    @IsOptional()
    prompt: string;

    @IsDate()
    @IsOptional()
    lastLogin: Date;
}
