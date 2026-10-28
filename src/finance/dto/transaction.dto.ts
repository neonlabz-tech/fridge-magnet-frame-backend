import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { TX_KINDS, TX_METHODS, TX_STATUSES } from '../schemas/transaction.schema';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateTransactionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsIn(TX_KINDS)
  kind!: string;

  @Matches(DATE_RX, { message: 'date must be YYYY-MM-DD' })
  date!: string;

  @IsOptional()
  @IsString()
  ref?: string;

  @IsOptional()
  @IsString()
  party?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsIn(TX_METHODS)
  method?: string;

  @IsOptional()
  @IsIn(TX_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  createdBy?: string;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsIn(TX_KINDS)
  kind?: string;

  @IsOptional()
  @Matches(DATE_RX, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsString()
  ref?: string;

  @IsOptional()
  @IsString()
  party?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsIn(TX_METHODS)
  method?: string;

  @IsOptional()
  @IsIn(TX_STATUSES)
  status?: string;
}
