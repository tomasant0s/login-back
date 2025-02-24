import { IsNotEmpty, IsString } from "class-validator"

export class CreateDietaDto{
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    cafeManha: string;

    @IsString()
    @IsNotEmpty()
    lancheManha: string;

    @IsString()
    @IsNotEmpty()
    almoco: string;

    @IsString()
    @IsNotEmpty()
    lancheTarde: string;

    @IsString()
    @IsNotEmpty()
    janta: string;
}