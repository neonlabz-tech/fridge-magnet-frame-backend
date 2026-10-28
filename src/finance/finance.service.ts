import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { escapeRegex, nextSequenceId } from '../common/utils/clean-json';

export interface TransactionQuery {
  kind?: string;
  status?: string;
  search?: string;
  createdBy?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly model: Model<TransactionDocument>,
  ) {}

  private buildFilter(q: TransactionQuery) {
    const filter: Record<string, any> = {};
    if (q.kind) filter.kind = q.kind;
    if (q.status) filter.status = q.status;
    if (q.createdBy) filter.createdBy = q.createdBy;
    if (q.from || q.to) {
      filter.date = {
        ...(q.from ? { $gte: q.from } : {}),
        ...(q.to ? { $lte: q.to } : {}),
      };
    }
    if (q.search?.trim()) {
      const rx = new RegExp(escapeRegex(q.search.trim()), 'i');
      filter.$or = [{ id: rx }, { ref: rx }, { party: rx }, { note: rx }];
    }
    return filter;
  }

  async findAll(q: TransactionQuery) {
    const filter = this.buildFilter(q);
    const data = await this.model.find(filter).sort({ date: -1, createdAt: -1 }).exec();
    return { data, total: data.length, summary: this.summarise(data) };
  }

  async summary(q: TransactionQuery) {
    const data = await this.model.find(this.buildFilter(q)).exec();
    return this.summarise(data);
  }

  private summarise(list: TransactionDocument[]) {
    const sum = (kind: string) =>
      list
        .filter((t) => t.kind === kind && t.status === 'completed')
        .reduce((a, t) => a + t.amount, 0);
    const totalIncome = sum('income');
    const totalExpense = sum('expense');
    return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
  }

  async findOne(id: string) {
    const tx = await this.model.findOne({ id }).exec();
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async create(dto: CreateTransactionDto) {
    const ids = (await this.model.find({}, 'id').exec()).map((t) => t.id);
    const id = dto.id && !ids.includes(dto.id) ? dto.id : nextSequenceId(ids, 'TXN-', 5);
    const tx = await this.model.create({ ...dto, id });
    return { message: 'Transaction recorded successfully', data: tx };
  }

  async update(id: string, dto: UpdateTransactionDto) {
    const tx = await this.model
      .findOneAndUpdate({ id }, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return { message: 'Transaction updated successfully', data: tx };
  }

  async remove(id: string) {
    const tx = await this.model.findOneAndDelete({ id }).exec();
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return { message: 'Transaction deleted successfully', data: tx };
  }
}
