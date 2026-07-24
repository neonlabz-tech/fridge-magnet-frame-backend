import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

    // Notify the admin about the new order. This must never block or fail order
    // placement, so failures are logged and swallowed.
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
    
    // Calculate items subtotal from actual item data
    let itemsSubtotal = 0;
    
    if (orderObj.items && orderObj.items.length > 0) {
      // Sum up each item's price × quantity from the stored order items
      itemsSubtotal = orderObj.items.reduce((sum, item) => {
        const itemPrice = Number(item.price || 0);
        const itemQuantity = Number(item.quantity || 1);
        return sum + (itemPrice * itemQuantity);
      }, 0);
    }
    
    
    const subtotal = Math.max(0, itemsSubtotal);
    const deliveryFee = subtotal > 0
      ? Math.max(0, orderObj.totalValue - subtotal)
      : 0;  
    const finalTotal = orderObj.totalValue;
    
    // Prepare receipt data
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
      items: orderObj.items,
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

}