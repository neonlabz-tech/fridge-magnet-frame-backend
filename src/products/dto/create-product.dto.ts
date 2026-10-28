import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PersonalizationLabelDto {
  @IsString()
  label!: string;
}

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

  @Type(() => Number)
  @IsNumber()
  imagecount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  manufactureCost?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : value === true || value === 'true',
  )
  @IsBoolean()
  isActive?: boolean;

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

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];

    let parsed: any;
    if (Array.isArray(value)) {
      parsed = value;
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        // not JSON — treat as comma-separated legacy string list
        return trimmed
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((label) => ({ label }));
      }
    } else {
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    // Handles both new format [{label}] and legacy format ["Black","White"]
    return parsed.map((item) =>
      typeof item === 'string' ? { label: item } : { label: item?.label ?? '' },
    );
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonalizationLabelDto)
  personalization?: PersonalizationLabelDto[];

  @IsOptional()
  @IsString()
  status?: string;
}