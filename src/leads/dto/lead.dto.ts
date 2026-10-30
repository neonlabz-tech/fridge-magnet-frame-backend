import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { LEAD_STATUSES } from '../schemas/lead.schema';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  dateAdded?: string;

  @IsString()
  @IsNotEmpty()
  business!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  callStatus?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  nextFollowUp?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  addedBy?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  history?: Record<string, any>[];

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsObject()
  order?: Record<string, any>;

  /** Who is making the change; used for audit entries. */
  @IsOptional()
  @IsString()
  actor?: string;
}

export class ImportLeadsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateLeadDto)
  leads!: CreateLeadDto[];
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  business?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  callStatus?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  nextFollowUp?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  addedBy?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  history?: Record<string, any>[];

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsObject()
  order?: Record<string, any>;

  @IsOptional()
  @IsString()
  actor?: string;
}

export class AddFollowUpDto {
  @IsOptional()
  @IsString()
  by?: string;

  @IsString()
  callStatus!: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  nextFollowUp?: string;
}

export class ConvertLeadDto {
  @IsOptional()
  @IsString()
  by?: string;

  @IsString()
  @IsNotEmpty()
  product!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ReassignLeadsDto {
  @IsString()
  @IsNotEmpty()
  from!: string;

  @IsString()
  to!: string;
}

export class UpsertTargetDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monthlyOrders!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salesAmount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  dailyCalls!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  dailyLeads!: number;
}

export class UpsertCommissionTierDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minSales!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  rate!: number;
}
