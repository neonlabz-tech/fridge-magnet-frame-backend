import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderDocument } from './schemas/order.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import {
  PdfGeneratorService,
  ReceiptPdfData,
} from './services/pdf-generator.service';

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

  private normalizeCustomerId(value?: string | null): string {
    return String(value ?? '')
      .replace(/^#+/, '')
      .trim();
  }

  private async resolveOrderCustomerId(order: {
    email?: string;
    customerId?: string;
  }): Promise<string> {
    const directValue = this.normalizeCustomerId(
      order.customerId,
    );

    if (!order.email) {
      return directValue;
    }

    const user = await this.usersService.findByEmail(
      order.email.trim().toLowerCase(),
    );

    if (user?.customerId) {
      return this.normalizeCustomerId(user.customerId);
    }

    return directValue;
  }

  private getStatusFromStock(stock: number): string {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
  }

  private async restoreStockForOrder(order: {
    items?: Array<{
      productId?: string;
      quantity?: number;
    }>;
  }): Promise<void> {
    if (!order?.items?.length) {
      return;
    }

    for (const item of order.items) {
      if (!item.productId) {
        continue;
      }

      const quantity = Math.max(
        Number(item.quantity || 0),
        0,
      );

      if (quantity === 0) {
        continue;
      }

      const product = Types.ObjectId.isValid(item.productId)
        ? await this.productModel.findById(item.productId)
        : await this.productModel.findOne({
            productId: item.productId,
          });

      if (!product) {
        this.logger.warn(
          `[Orders] Product ${item.productId} not found while restoring stock`,
        );
        continue;
      }

      const previousStock = Number(product.stock || 0);
      const newStock = previousStock + quantity;

      product.stock = newStock;
      product.status = this.getStatusFromStock(newStock);
      product.updatedAt = new Date();

      if (Array.isArray(product.stockHistory)) {
        product.stockHistory.push({
          previousStock,
          newStock,
          changedBy: 'System (Order Cancelled)',
          changedAt: new Date(),
        });
      }

      await product.save();

      this.logger.log(
        `[Orders] Restored ${quantity} stock for product ${product.productId}. ` +
          `Stock: ${previousStock} -> ${newStock}`,
      );
    }
  }

  private async attachItemSkus(
    orders: Record<string, any>[],
  ): Promise<Record<string, any>[]> {
    const idSet = new Set<string>();
    const codeSet = new Set<string>();

    for (const order of orders) {
      for (const item of order.items || []) {
        if (!item?.productId) continue;

        if (Types.ObjectId.isValid(item.productId)) {
          idSet.add(item.productId);
        } else {
          codeSet.add(item.productId);
        }
      }
    }

    if (idSet.size === 0 && codeSet.size === 0) {
      return orders.map((order) => ({
        ...order,
        items: (order.items || []).map((item: any) => ({
          ...item,
          sku: null,
        })),
      }));
    }

    const productsById: ProductDocument[] = idSet.size
      ? await this.productModel
          .find({
            _id: {
              $in: Array.from(idSet),
            },
          })
          .select('productId')
          .exec()
      : [];

    const productsByCode: ProductDocument[] = codeSet.size
      ? await this.productModel
          .find({
            productId: {
              $in: Array.from(codeSet),
            },
          })
          .select('productId')
          .exec()
      : [];

    const skuById = new Map<string, string>();

    for (const product of productsById) {
      skuById.set(
        String(product._id),
        product.productId,
      );
    }

    const skuByCode = new Map<string, string>();

    for (const product of productsByCode) {
      skuByCode.set(
        product.productId,
        product.productId,
      );
    }

    return orders.map((order) => ({
      ...order,
      items: (order.items || []).map((item: any) => {
        const sku = item.productId
          ? skuById.get(item.productId) ??
            skuByCode.get(item.productId)
          : undefined;

        return {
          ...item,
          sku: sku ?? null,
        };
      }),
    }));
  }

  async create(dto: CreateOrderDto): Promise<any> {
    if (dto.items?.length) {
      for (const item of dto.items) {
        if (!item.productId) {
          continue;
        }

        const quantity = Math.max(
          Number(item.quantity || 0),
          0,
        );

        if (quantity === 0) {
          continue;
        }

        const product = Types.ObjectId.isValid(
          item.productId,
        )
          ? await this.productModel.findById(item.productId)
          : await this.productModel.findOne({
              productId: item.productId,
            });

        if (!product) {
          throw new NotFoundException(
            'Product not found',
          );
        }

        if (Number(product.stock || 0) < quantity) {
          throw new BadRequestException(
            `${product.productName} stock not available`,
          );
        }

        product.stock =
          Number(product.stock || 0) - quantity;

        product.status = this.getStatusFromStock(
          product.stock,
        );

        product.updatedAt = new Date();

        await product.save();
      }
    }

    const resolvedCustomerId =
      await this.resolveOrderCustomerId({
        email: dto.email,
        customerId: dto.customerId,
      });

    const order = await this.orderModel.create({
      ...dto,
      customerId: resolvedCustomerId,
    });

    await this.usersService.updateFromOrder({
      email: dto.email,
      customerName: dto.customerName,
      phone: dto.phone,
      shippingAddress: dto.shippingAddress ?? '',
    });

    try {
      const result =
        await this.mailService.sendOrderPlacedAdminNotification(
          {
            orderId: order.orderId,
            customerName: order.customerName,
            email: order.email,
            phone: order.phone,
            qty: order.qty,
            totalValue: order.totalValue,
            shippingAddress: order.shippingAddress,
            district: order.district,
            items: order.items,
          },
        );

      if (!result.success) {
        this.logger.warn(
          `[Orders] Admin notification not sent for order ${order.orderId}: ${result.error}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `[Orders] Admin notification threw for order ${order.orderId}: ${
          err instanceof Error
            ? err.message
            : String(err)
        }`,
      );
    }

    return order;
  }

  async findAll(
    status?: string,
    search?: string,
  ): Promise<Record<string, any>[]> {
    const filter: Record<string, any> = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        {
          orderId: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          customerName: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          district: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const orders: OrderDocument[] =
      await this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .exec();

    const ordersWithCustomerId: Record<string, any>[] =
      await Promise.all(
        orders.map(async (order) => {
          const plainOrder: Record<string, any> =
            order.toObject();

          const customerId =
            await this.resolveOrderCustomerId({
              email: plainOrder.email,
              customerId: plainOrder.customerId,
            });

          return {
            ...plainOrder,
            customerId,
          };
        }),
      );

    return this.attachItemSkus(
      ordersWithCustomerId,
    );
  }

  /**
   * Find order by business orderId.
   * Example: orderId = "10"
   */
  async findByOrderId(
    orderId: string,
  ): Promise<Record<string, any>> {
    const order: OrderDocument | null =
      await this.orderModel
        .findOne({ orderId })
        .exec();

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const plainOrder: Record<string, any> =
      order.toObject();

    const customerId =
      await this.resolveOrderCustomerId({
        email: plainOrder.email,
        customerId: plainOrder.customerId,
      });

    const enrichedOrders =
      await this.attachItemSkus([
        {
          ...plainOrder,
          customerId,
        },
      ]);

    return enrichedOrders[0];
  }

  /**
   * Find order by either MongoDB _id or business orderId.
   */
  async findOne(
    id: string,
  ): Promise<Record<string, any>> {
    let order: OrderDocument | null = null;

    if (Types.ObjectId.isValid(id)) {
      order = await this.orderModel
        .findById(id)
        .exec();
    }

    if (!order) {
      order = await this.orderModel
        .findOne({ orderId: id })
        .exec();
    }

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const plainOrder: Record<string, any> =
      order.toObject();

    const customerId =
      await this.resolveOrderCustomerId({
        email: plainOrder.email,
        customerId: plainOrder.customerId,
      });

    const [enriched] =
      await this.attachItemSkus([
        {
          ...plainOrder,
          customerId,
        },
      ]);

    return enriched;
  }

  private normalizeOrderStatus(
    status?: string,
  ): string {
    const normalized = String(status ?? '')
      .trim()
      .toUpperCase();

    if (normalized === 'CANCELLED') {
      return 'CANCELED';
    }

    return normalized;
  }

  /**
   * Update order status using either:
   * - MongoDB _id
   * - business orderId
   */
  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<any> {
    let order: OrderDocument | null = null;

    if (Types.ObjectId.isValid(id)) {
      order = await this.orderModel
        .findById(id)
        .exec();
    }

    if (!order) {
      order = await this.orderModel
        .findOne({ orderId: id })
        .exec();
    }

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const previousStatus =
      this.normalizeOrderStatus(order.status);

    const nextStatus =
      this.normalizeOrderStatus(dto.status);

    const currentRank =
      this.statusRank[previousStatus] ?? 0;

    const nextRank =
      this.statusRank[nextStatus] ?? 0;

    if (nextRank < currentRank) {
      throw new BadRequestException(
        `Order status cannot move back from ${order.status} to ${dto.status}`,
      );
    }

    if (
      previousStatus !== 'CANCELED' &&
      nextStatus === 'CANCELED'
    ) {
      await this.restoreStockForOrder(
        order.toObject(),
      );
    }

    order.status = nextStatus as any;
    order.adminNote = dto.adminNote;

    await order.save();

    const plainOrder = order.toObject();

    if (!dto.sendEmailNotification) {
      const [enriched] =
        await this.attachItemSkus([
          plainOrder,
        ]);

      return enriched;
    }

    if (!order.email) {
      this.logger.warn(
        `[Orders] sendEmailNotification=true but order ${order.orderId} has no email address`,
      );

      const [enriched] =
        await this.attachItemSkus([
          {
            ...plainOrder,
            emailNotification: {
              attempted: false,
              success: false,
              error:
                'Order has no email address',
            },
          },
        ]);

      return enriched;
    }

    const emailResult =
      await this.mailService.sendOrderStatusUpdate({
        to: order.email,
        customerName: order.customerName,
        orderId: order.orderId,
        newStatus: nextStatus,
        adminNote: dto.adminNote,
      });

    const [enriched] =
      await this.attachItemSkus([
        {
          ...plainOrder,
          emailNotification: {
            attempted: true,
            success: emailResult.success,
            ...(emailResult.error
              ? {
                  error: emailResult.error,
                }
              : {}),
          },
        },
      ]);

    return enriched;
  }

  /**
   * Delete order using either:
   * - MongoDB _id
   * - business orderId
   */
  async delete(id: string): Promise<any> {
    let order: OrderDocument | null = null;

    if (Types.ObjectId.isValid(id)) {
      order = await this.orderModel
        .findById(id)
        .exec();
    }

    if (!order) {
      order = await this.orderModel
        .findOne({ orderId: id })
        .exec();
    }

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    await this.orderModel
      .deleteOne({ _id: order._id })
      .exec();

    return {
      message: 'Order deleted successfully',
    };
  }

  async generateReceipt(
    orderNumber: string,
  ): Promise<Buffer> {
    const order =
      await this.orderModel.findOne({
        orderId: orderNumber,
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const orderObj = order.toObject();

    const getLineTotal = (
      price: number,
      quantity: number,
      name?: string,
    ): number => {
      const normalized = String(name ?? '')
        .trim()
        .toLowerCase();

      const isFourMagnetsPack =
        normalized === '4 magnets' ||
        normalized.startsWith('4 magnets ');

      const packSize =
        isFourMagnetsPack ? 4 : 1;

      return price * (quantity / packSize);
    };

    let itemsSubtotal = 0;

    if (
      orderObj.items &&
      orderObj.items.length > 0
    ) {
      itemsSubtotal = orderObj.items.reduce(
        (sum, item) => {
          const itemPrice = Number(
            item.price || 0,
          );

          const itemQuantity = Number(
            item.quantity || 1,
          );

          return (
            sum +
            getLineTotal(
              itemPrice,
              itemQuantity,
              item.name,
            )
          );
        },
        0,
      );
    }

    const SHIPPING_FEE = 200;

    const subtotal = Math.max(
      0,
      itemsSubtotal,
    );

    const deliveryFee =
      orderObj.shippingAddress
        ? SHIPPING_FEE
        : 0;

    const finalTotal =
      subtotal + deliveryFee;

    const itemsWithBase64Images =
      orderObj.items &&
      orderObj.items.length > 0
        ? await Promise.all(
            orderObj.items.map(
              async (item) => {
                if (
                  item.image &&
                  typeof item.image ===
                    'string' &&
                  item.image.startsWith(
                    'http',
                  )
                ) {
                  try {
                    const base64Image =
                      await this.imageUrlToBase64(
                        item.image,
                      );

                    return {
                      ...item,
                      image: base64Image,
                    };
                  } catch (err) {
                    this.logger.warn(
                      `[Orders] Failed to convert item image to base64 for order ${orderNumber}: ${err}`,
                    );

                    return {
                      ...item,
                      image: undefined,
                    };
                  }
                }

                return item;
              },
            ),
          )
        : orderObj.items;

    const receiptData: ReceiptPdfData = {
      orderId: orderObj.orderId,
      customerName:
        orderObj.customerName,
      email: orderObj.email,
      phone: orderObj.phone,
      shippingAddress:
        orderObj.shippingAddress,
      district: orderObj.district,
      status: orderObj.status,
      totalValue: finalTotal,
      subtotal,
      deliveryFee,
      qty: orderObj.qty,
      items: itemsWithBase64Images,
      createdAt:
        (orderObj as any).createdAt ||
        new Date(),
      adminNote: orderObj.adminNote,
    };

    try {
      const pdfBuffer =
        await this.pdfGeneratorService.generateReceipt(
          receiptData,
        );

      this.logger.log(
        `PDF receipt generated successfully for order: ${orderNumber}`,
      );

      return pdfBuffer;
    } catch (error) {
      this.logger.error(
        `PDF generation failed for order ${orderNumber}:`,
        error,
      );

      throw new Error(
        'Unable to generate receipt PDF. Please contact support.',
      );
    }
  }

  private async imageUrlToBase64(
    url: string,
  ): Promise<string> {
    const jpegUrl =
      url.includes('cloudinary.com')
        ? url.replace(
            '/upload/',
            '/upload/f_jpg/',
          )
        : url;

    const response = await axios.get(
      jpegUrl,
      {
        responseType: 'arraybuffer',
        timeout: 10000,
      },
    );

    return `data:image/jpeg;base64,${Buffer.from(
      response.data,
    ).toString('base64')}`;
  }
}