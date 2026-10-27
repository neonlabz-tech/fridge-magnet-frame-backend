import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';

export class MaterialLineDto {
  @IsString()
  @IsNotEmpty()
  inventoryId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  qty!: number;
}

export class SaveMaterialsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialLineDto)
  items!: MaterialLineDto[];
}
