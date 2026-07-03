import { IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  productName!: string;

  @IsString()
  productId!: string;

  // @IsString()
  // category!: string;

  @Type(() => Number)
  @IsNumber()
  stock!: number;

  @Type(() => Number)
  @IsNumber()
  price!: number;

  @IsString()
  description!: string;

  // @IsOptional()
  // @Transform(({ value }) =>
  //   value === undefined || value === null || value === ''
  //     ? undefined
  //     : value === true || value === 'true',
  // )
  // @IsIn([true, false])
  // personalizationEnabled?: boolean;

  // @IsOptional()
  // @Transform(({ value }) => {
  //   if (Array.isArray(value)) return value;

  //   if (typeof value === 'string') {
  //     const trimmed = value.trim();
  //     if (!trimmed) return [];
  //     try {
  //       const parsed = JSON.parse(trimmed);
  //       return Array.isArray(parsed) ? parsed : [parsed];
  //     } catch {
  //       return [trimmed];
  //     }
  //   }

  //   if (value === undefined || value === null) return [];

  //   return [value];
  // })
  // @IsArray()
  // personalization?: any[];

  @IsOptional()
  @IsString()
  status?: string;
}