import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LOW_STOCK_LIMIT,
  InventoryItem,
  InventoryItemDocument,
} from './schemas/inventory.schema';
import {
  AdjustStockDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import { escapeRegex, nextSequenceId } from '../common/utils/clean-json';

const DEFAULT_ROLE = 'Admin/Director';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryItem.name)
    private readonly model: Model<InventoryItemDocument>,
  ) {}

  private statusFilter(status?: string) {
    switch (status) {
      case 'out-of-stock':
        return { stock: { $lte: 0 } };
      case 'low-stock':
        return { stock: { $gt: 0, $lt: LOW_STOCK_LIMIT } };
      case 'in-stock':
        return { stock: { $gte: LOW_STOCK_LIMIT } };
      default:
        return {};
    }
  }

  async findAll(search?: string, status?: string) {
    const filter: Record<string, any> = this.statusFilter(status);
    if (search?.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ id: rx }, { name: rx }];
    }

    const data = await this.model.find(filter).sort({ createdAt: -1 }).exec();
    const all = await this.model.find({}, 'stock').exec();

    return {
      data,
      total: data.length,
      summary: {
        totalItems: all.length,
        lowStock: all.filter((i) => i.stock > 0 && i.stock < LOW_STOCK_LIMIT).length,
        outOfStock: all.filter((i) => i.stock <= 0).length,
      },
    };
  }

  async findOne(id: string) {
    const item = await this.model.findOne({ id }).exec();
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return item;
  }

  async create(dto: CreateInventoryItemDto) {
    const ids = (await this.model.find({}, 'id').exec()).map((i) => i.id);
    const id = dto.id && !ids.includes(dto.id) ? dto.id : nextSequenceId(ids, 'ITEM-', 4);
    const stock = dto.stock ?? 0;
    const unitValue = dto.unitValue ?? 0;

    const history =
      dto.history ??
      (stock > 0
        ? [
            {
              at: new Date().toISOString(),
              role: dto.role ?? DEFAULT_ROLE,
              change: stock,
              totalValue: stock * unitValue,
            },
          ]
        : []);

    const item = await this.model.create({
      id,
      name: dto.name,
      stock,
      unitValue,
      history,
    });
    return { message: 'Inventory item created successfully', data: item };
  }

  async update(id: string, dto: UpdateInventoryItemDto) {
    const item = await this.findOne(id);
    const { role, ...fields } = dto;

    if (fields.stock !== undefined && fields.history === undefined && fields.stock !== item.stock) {
      const unitValue = fields.unitValue ?? item.unitValue;
      item.history.push({
        at: new Date().toISOString(),
        role: role ?? DEFAULT_ROLE,
        change: fields.stock - item.stock,
        totalValue: fields.stock * unitValue,
      });
      item.markModified('history');
    }

    Object.assign(item, fields);
    await item.save();
    return { message: 'Inventory item updated successfully', data: item };
  }

  async adjustStock(id: string, dto: AdjustStockDto) {
    const item = await this.findOne(id);
    const next = item.stock + dto.change;
    if (next < 0) {
      throw new BadRequestException(`Stock cannot go below zero (current ${item.stock})`);
    }

    item.stock = next;
    item.history.push({
      at: new Date().toISOString(),
      role: dto.role ?? DEFAULT_ROLE,
      change: dto.change,
      totalValue: next * item.unitValue,
    });
    item.markModified('history');
    await item.save();
    return { message: 'Stock adjusted successfully', data: item };
  }

  async remove(id: string) {
    const item = await this.model.findOneAndDelete({ id }).exec();
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return { message: 'Inventory item deleted successfully', data: item };
  }
}
