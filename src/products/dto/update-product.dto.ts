import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PersonalizationLabelDto } from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  productName?: any;

  @IsOptional()
  productId?: any;

  // @IsOptional()
  // category?: any;

  @IsOptional()
  stock?: any;

  @IsOptional()
  price?: any;

  @IsOptional()
  description?: any;

  // @IsOptional()
  // personalizationEnabled?: any;

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
  status?: string;
}