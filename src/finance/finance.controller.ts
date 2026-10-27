import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';

@Controller('finance/transactions')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  findAll(
    @Query('kind') kind?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('createdBy') createdBy?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.findAll({ kind, status, search, createdBy, from, to });
  }

  @Get('summary')
  summary(
    @Query('createdBy') createdBy?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.summary({ createdBy, from, to });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.financeService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.financeService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.financeService.update(id, dto);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.financeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financeService.remove(id);
  }
}
