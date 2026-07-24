import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { PdfGeneratorService, ReceiptPdfData } from './services/pdf-generator.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
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
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  private getStatusFromStock(stock: number) {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
  }

  async create(dto: CreateOrderDto) {
    if (dto.items?.length) {
      for (const item of dto.items) {
        if (!item.productId) continue;

        const quantity = Math.max(Number(item.quantity || 0), 0);
        if (quantity === 0) continue;

        const product = Types.ObjectId.isValid(item.productId)
          ? await this.productModel.findById(item.productId)
          : await this.productModel.findOne({ productId: item.productId });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        if (Number(product.stock || 0) < quantity) {
          throw new BadRequestException(
            `${product.productName} stock not available`,
          );
        }

        product.stock = Number(product.stock || 0) - quantity;
        product.status = this.getStatusFromStock(product.stock);
        product.updatedAt = new Date();

        await product.save();
      }
    }

    const order = await this.orderModel.create(dto);
    await this.usersService.updateFromOrder({
      email: dto.email,
      customerName: dto.customerName,
      phone: dto.phone,
      shippingAddress: dto.shippingAddress,
    });

    try {
      const result = await this.mailService.sendOrderPlacedAdminNotification({
        orderId: order.orderId,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        qty: order.qty,
        totalValue: order.totalValue,
        shippingAddress: order.shippingAddress,
        district: order.district,
        items: order.items,
      });
      if (!result.success) {
        this.logger.warn(
          `[Orders] Admin notification not sent for order ${order.orderId}: ${result.error}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `[Orders] Admin notification threw for order ${order.orderId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
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
        { district: { $regex: search, $options: 'i' } },
      ];
    }

    return this.orderModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByOrderId(orderId: string) {
    const order = await this.orderModel.findOne({ orderId: orderId });
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

    if (!dto.sendEmailNotification) {
      return order;
    }

    if (!order.email) {
      this.logger.warn(
        `[Orders] sendEmailNotification=true but order ${order.orderId} has no email address`,
      );
      return {
        ...order.toObject(),
        emailNotification: { attempted: false, success: false, error: 'Order has no email address' },
      };
    }

    const emailResult = await this.mailService.sendOrderStatusUpdate({
      to: order.email,
      customerName: order.customerName,
      orderId: order.orderId,
      newStatus: dto.status,
      adminNote: dto.adminNote,
    });

    return {
      ...order.toObject(),
      emailNotification: {
        attempted: true,
        success: emailResult.success,
        ...(emailResult.error ? { error: emailResult.error } : {}),
      },
    };
  }

  async delete(id: string) {
    const order = await this.orderModel.findByIdAndDelete(id);
    if (!order) throw new NotFoundException('Order not found');

    return {
      message: 'Order deleted successfully',
    };
  }

  async generateReceipt(orderNumber: string): Promise<Buffer> {
    const order = await this.orderModel.findOne({ orderId: orderNumber });
    if (!order) throw new NotFoundException('Order not found');

    const orderObj = order.toObject();

    const getLineTotal = (price: number, quantity: number, name?: string): number => {
      const normalized = String(name ?? '').trim().toLowerCase();
      const isFourMagnetsPack =
        normalized === '4 magnets' || normalized.startsWith('4 magnets ');
      const packSize = isFourMagnetsPack ? 4 : 1;
      return price * (quantity / packSize);
    };

    let itemsSubtotal = 0;

    if (orderObj.items && orderObj.items.length > 0) {
      itemsSubtotal = orderObj.items.reduce((sum, item) => {
        const itemPrice = Number(item.price || 0);
        const itemQuantity = Number(item.quantity || 1);
        return sum + getLineTotal(itemPrice, itemQuantity, item.name);
      }, 0);
    }

    const SHIPPING_FEE = 200;
    const subtotal = Math.max(0, itemsSubtotal);
    const deliveryFee = orderObj.shippingAddress ? SHIPPING_FEE : 0;
    const finalTotal = subtotal + deliveryFee;

    const itemsWithBase64Images = orderObj.items && orderObj.items.length > 0
      ? await Promise.all(
          orderObj.items.map(async (item) => {
            if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
              try {
                const base64Image = await this.imageUrlToBase64(item.image);
                return { ...item, image: base64Image };
              } catch (err) {
                this.logger.warn(
                  `[Orders] Failed to convert item image to base64 for order ${orderNumber}: ${err}`,
                );
                return { ...item, image: undefined };
              }
            }
            return item;
          }),
        )
      : orderObj.items;

    const receiptData: ReceiptPdfData = {
      orderId: orderObj.orderId,
      customerName: orderObj.customerName,
      email: orderObj.email,
      phone: orderObj.phone,
      shippingAddress: orderObj.shippingAddress,
      district: orderObj.district,
      status: orderObj.status,
      totalValue: finalTotal,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      qty: orderObj.qty,
      items: itemsWithBase64Images,
      createdAt: (orderObj as any).createdAt || new Date(),
      adminNote: orderObj.adminNote,
    };

    try {
      const pdfBuffer = await this.pdfGeneratorService.generateReceipt(receiptData);
      this.logger.log(`PDF receipt generated successfully for order: ${orderNumber}`);
      return pdfBuffer;
    } catch (error) {
      this.logger.error(`PDF generation failed for order ${orderNumber}:`, error);
      throw new Error('Unable to generate receipt PDF. Please contact support.');
    }
  }

  private async imageUrlToBase64(url: string): Promise<string> {
    const jpegUrl = url.includes('cloudinary.com')
      ? url.replace('/upload/', '/upload/f_jpg/')
      : url;

    const response = await axios.get(jpegUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    return `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`;
  }
}