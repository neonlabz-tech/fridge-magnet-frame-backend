import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class OrdersService {
  private readonly statusRank: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 1,
    SHIPPED: 2,
    DELIVERED: 3,
    CANCELED: 4,
  };

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  private getStatusFromStock(stock: number) {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
  }

  async create(dto: CreateOrderDto) {
    const order = await this.orderModel.create(dto);

    if (dto.items?.length) {
      await Promise.all(
        dto.items.map(async (item) => {
          if (!item.productId) return;

          const quantity = Math.max(Number(item.quantity || 0), 0);
          if (quantity === 0) return;

          const product = Types.ObjectId.isValid(item.productId)
            ? await this.productModel.findById(item.productId)
            : await this.productModel.findOne({ productId: item.productId });

          if (!product) return;

          const nextStock = Math.max(Number(product.stock || 0) - quantity, 0);
          product.stock = nextStock;
          product.status = this.getStatusFromStock(nextStock);
          product.updatedAt = new Date();
          await product.save();
        }),
      );
    }

    return order;
  }

  findAll(status?: string, search?: string) {
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    return this.orderModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const currentRank = this.statusRank[order.status];
    const nextRank = this.statusRank[dto.status];

    if (nextRank < currentRank) {
      throw new BadRequestException(
        `Order status cannot move back from ${order.status} to ${dto.status}`,
      );
    }

    order.status = dto.status;
    order.adminNote = dto.adminNote;
    await order.save();

    return order;
  }

  async delete(id: string) {
    const order = await this.orderModel.findByIdAndDelete(id);
    if (!order) throw new NotFoundException('Order not found');

    return {
      message: 'Order deleted successfully',
    };
  }
}
