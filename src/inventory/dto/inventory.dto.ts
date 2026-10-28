import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitValue?: number;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsArray()
  history?: Record<string, any>[];
}

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitValue?: number;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsArray()
  history?: Record<string, any>[];
}

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt()
  change!: number;

  @IsOptional()
  @IsString()
  role?: string;
}
