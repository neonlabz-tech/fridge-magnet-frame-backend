import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductMaterials, ProductMaterialsDocument } from './schemas/material.schema';
import { SaveMaterialsDto } from './dto/material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectModel(ProductMaterials.name)
    private readonly model: Model<ProductMaterialsDocument>,
  ) {}

  /** { [productKey]: [{ inventoryId, qty }] } for every product that has materials. */
  async findAll() {
    const list = await this.model.find().exec();
    const data = Object.fromEntries(list.map((m) => [m.productKey, m.items]));
    return { data, total: list.length };
  }

  async findOne(productKey: string) {
    const doc = await this.model.findOne({ productKey }).exec();
    return { data: doc?.items ?? [] };
  }

  /** Replaces the materials of a product. An empty list removes the record. */
  async save(productKey: string, dto: SaveMaterialsDto) {
    const items = dto.items.filter((i) => i.qty > 0);
    if (!items.length) {
      await this.model.deleteOne({ productKey }).exec();
      return { message: 'Materials cleared', data: [] };
    }
    const doc = await this.model
      .findOneAndUpdate(
        { productKey },
        { $set: { items } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
    return { message: 'Materials saved successfully', data: doc.items };
  }

  async remove(productKey: string) {
    await this.model.deleteOne({ productKey }).exec();
    return { message: 'Materials removed successfully' };
  }
}
