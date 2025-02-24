import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class PaginationDto {
    @Type(() => Number)
    @IsInt()
    @IsOptional()
    limit: number;

    @Type(() => Number)
    @IsInt()
    @IsOptional()
    offset: number;
}