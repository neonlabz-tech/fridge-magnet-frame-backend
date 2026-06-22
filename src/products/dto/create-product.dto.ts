import { IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  productName: string;

  @IsString()
  productId: string;

  @IsString()
  category: string;

  @Type(() => Number)
  @IsNumber()
  stock: number;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsString()
  description: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : value === true || value === 'true',
  )
  @IsIn([true, false])
  personalizationEnabled?: boolean;

  @IsOptional()
  @IsArray()
  personalization?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}
