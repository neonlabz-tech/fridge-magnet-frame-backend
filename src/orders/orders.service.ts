import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CloudflareR2Service } from '../cloudflareR2/cloudflareR2.service';
import {
  Transaction,
  TransactionDocument,
} from '../finance/schemas/transaction.schema';

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
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,

    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly cloudflareR2Service: CloudflareR2Service,
  ) {}

  /* ---------- Finance: paid orders become income ---------- */

  private incomeTxId(orderId: string): string {
    return `ORDINC-${String(orderId).replace(/^#+/, '')}`;
  }

  private incomeMethod(method?: string): 'Cash' | 'Bank Transfer' | 'Card Payment' {
    const m = String(method ?? '').toLowerCase();
    if (m.includes('bank')) return 'Bank Transfer';
    if (m.includes('card')) return 'Card Payment';
    return 'Cash'; // cod / cash / unknown
  }

  /**
   * Keeps one automatic Finance income record per order:
   * paid (and not cancelled) -> record exists, otherwise -> record removed.
   */
  private async syncOrderIncome(order: {
    orderId: string;
    customerName?: string;
    totalValue?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    status?: string;
  }): Promise<void> {
    try {
      const id = this.incomeTxId(order.orderId);
      const paid =
        String(order.paymentStatus ?? '').toLowerCase() === 'paid' &&
        String(order.status ?? '').toUpperCase() !== 'CANCELED' &&
        Number(order.totalValue ?? 0) > 0;

      if (!paid) {
        await this.transactionModel.deleteOne({ id }).exec();
        return;
      }

      const existing = await this.transactionModel.findOne({ id }).exec();
      const fields = {
        kind: 'income',
        ref: order.orderId,
        party: order.customerName ?? '',
        note: 'Order payment (auto)',
        amount: Number(order.totalValue ?? 0),
        method: this.incomeMethod(order.paymentMethod),
        status: 'completed',
      };

      if (existing) {
        // keep the original date, refresh the rest (amount/method can change)
        await this.transactionModel.updateOne({ id }, { $set: fields }).exec();
        return;
      }

      await this.transactionModel.create({
        id,
        date: new Date().toISOString().slice(0, 10),
        createdBy: 'admin',
        ...fields,
      });
    } catch (err) {
      this.logger.error(
        `[Orders] Could not sync finance income for ${order.orderId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** Creates income records for every order that is already paid (skips ones that already have an income with the same ref). */
  async backfillOrderIncomes(): Promise<{ created: number; skipped: number }> {
    const orders = await this.orderModel
      .find({ paymentStatus: 'paid', status: { $ne: OrderStatus.CANCELED } })
      .exec();
    let created = 0;
    let skipped = 0;

    for (const o of orders) {
      const id = this.incomeTxId(o.orderId);
      const already = await this.transactionModel
        .findOne({ $or: [{ id }, { kind: 'income', ref: o.orderId }] })
        .exec();
      if (already) {
        skipped += 1;
        continue;
      }
      await this.syncOrderIncome(o.toObject());
      created += 1;
    }
    return { created, skipped };
  }

  /* ---------- customer photo clean-up ---------- */

  private photoTimer?: NodeJS.Timeout;
  private photoStartTimer?: NodeJS.Timeout;

  onModuleInit() {
    // Hourly check (first run 1 minute after start). No extra scheduler package needed.
    this.photoStartTimer = setTimeout(() => void this.purgeExpiredCustomerImages(), 60_000);
    this.photoTimer = setInterval(() => void this.purgeExpiredCustomerImages(), 60 * 60 * 1000);
    this.photoStartTimer.unref?.();
    this.photoTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.photoStartTimer) clearTimeout(this.photoStartTimer);
    if (this.photoTimer) clearInterval(this.photoTimer);
  }

  /** R2 object key of a customer upload, or null if the URL is not one of ours (only `orders/` is ever deleted). */
  private customerImageKey(url: string): string | null {
    const base = String(process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
    if (!base || typeof url !== 'string' || !url.startsWith(`${base}/`)) return null;
    try {
      const key = url
        .slice(base.length + 1)
        .split(/[?#]/)[0]
        .split('/')
        .map(decodeURIComponent)
        .join('/');
      return key.startsWith('orders/') && !key.includes('..') ? key : null;
    } catch {
      return null;
    }
  }

  /** Deletes the customer's uploaded photos of an order from R2 and removes them from the order. */
  private async purgeCustomerImages(order: OrderDocument): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;
    const items = (order.items ?? []).map((item) => ({ ...item }));

    for (const item of items) {
      const kept: string[] = [];
      for (const url of item.uploadedImages ?? []) {
        const key = this.customerImageKey(url);
        if (!key) {
          kept.push(url); // not a customer upload in our bucket: never touched
          continue;
        }
        try {
          await this.cloudflareR2Service.deleteImage(key);
          deleted += 1;
        } catch (err) {
          failed += 1;
          kept.push(url);
          this.logger.warn(`[Orders] Could not delete ${key} of ${order.orderId}: ${err}`);
        }
      }
      item.uploadedImages = kept;
    }

    order.items = items as any;
    order.markModified('items');
    if (failed === 0) order.imagesDeletedAt = new Date();
    await order.save();
    return { deleted, failed };
  }

  /** Delivered orders older than the retention period (default 7 days) lose their customer photos. */
  async purgeExpiredCustomerImages(): Promise<void> {
    try {
      const days = Number(process.env.CUSTOMER_IMAGE_RETENTION_DAYS ?? 7) || 7;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const filter: any = {
        status: OrderStatus.DELIVERED,
        imagesDeletedAt: { $exists: false },
        $or: [
          { deliveredAt: { $lte: cutoff } },
          { deliveredAt: { $exists: false }, updatedAt: { $lte: cutoff } },
        ],
      };
      const orders = await this.orderModel.find(filter).limit(50).exec();
      for (const order of orders) {
        const { deleted } = await this.purgeCustomerImages(order);
        if (deleted) this.logger.log(`[Orders] Removed ${deleted} customer photo(s) of ${order.orderId}`);
      }
    } catch (err) {
      this.logger.error(`[Orders] Customer photo clean-up failed: ${err}`);
    }
  }

  /** Reads a customer photo (our bucket, `orders/` folder only) so the dashboard can download it without CORS problems. */
  async fetchCustomerPhoto(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (!this.customerImageKey(url)) {
      throw new BadRequestException('Not a customer photo.');
    }
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
      return {
        buffer: Buffer.from(response.data),
        contentType: String(response.headers['content-type'] || 'application/octet-stream'),
      };
    } catch {
      throw new NotFoundException('Photo not found. It may have been deleted.');
    }
  }

  /** Manual clean-up from the dashboard. Only delivered orders. */
  async deleteCustomerImages(id: string): Promise<any> {
    let order: OrderDocument | null = null;
    if (Types.ObjectId.isValid(id)) order = await this.orderModel.findById(id).exec();
    if (!order) order = await this.orderModel.findOne({ orderId: id }).exec();
    if (!order) throw new NotFoundException('Order not found');

    if (this.normalizeOrderStatus(order.status) !== 'DELIVERED') {
      throw new BadRequestException('Customer photos can be deleted only after the order is delivered.');
    }

    const { deleted, failed } = await this.purgeCustomerImages(order);
    if (failed > 0) {
      throw new BadRequestException(`${failed} photo(s) could not be deleted. Please try again.`);
    }
    const [enriched] = await this.attachItemSkus([order.toObject()]);
    return { message: `${deleted} photo(s) deleted`, deleted, data: enriched };
  }

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

  private getStockQuantity(
    productName: string,
    requestedQuantity: number,
  ): number {
    const magnetCount = productName.match(/(\d+)\s*magnets?/i);

    return magnetCount
      ? Number(magnetCount[1])
      : Math.max(requestedQuantity, 0);
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

  /** Reverse of restoreStockForOrder: used when a cancelled order is re-opened. */
  private async deductStockForOrder(order: {
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

      const quantity = Math.max(Number(item.quantity || 0), 0);
      if (quantity === 0) {
        continue;
      }

      const product = Types.ObjectId.isValid(item.productId)
        ? await this.productModel.findById(item.productId)
        : await this.productModel.findOne({
            productId: item.productId,
          });

      if (!product) {
        continue;
      }

      const previousStock = Number(product.stock || 0);
      const newStock = Math.max(previousStock - quantity, 0);

      product.stock = newStock;
      product.status = this.getStatusFromStock(newStock);
      product.updatedAt = new Date();

      if (Array.isArray(product.stockHistory)) {
        product.stockHistory.push({
          previousStock,
          newStock,
          changedBy: 'System (Order Re-opened)',
          changedAt: new Date(),
        });
      }

      await product.save();
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

  /** Payment rules for orders placed from the website. */
  private validateWebsitePayment(dto: CreateOrderDto): void {
    if (dto.orderSource === 'direct') {
      return;
    }

    const method = String(dto.paymentMethod ?? '').toLowerCase();

    if (method === 'cod') {
      if (!dto.shippingAddress?.toLowerCase().includes('jaffna')) {
        throw new BadRequestException(
          'Cash on Delivery is available only for Jaffna addresses.',
        );
      }
    } else if (method === 'bank_transfer') {
      if (!dto.paymentSlipUrl?.trim()) {
        throw new BadRequestException(
          'Please upload your bank transfer receipt.',
        );
      }
    } else if (method === 'card') {
      throw new BadRequestException(
        'Card payment is currently unavailable.',
      );
    } else {
      throw new BadRequestException('Please choose a valid payment method.');
    }
  }

  async create(dto: CreateOrderDto): Promise<any> {
    this.validateWebsitePayment(dto);

    if (dto.items?.length) {
      for (const item of dto.items) {
        if (!item.productId) {
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

        if (
          dto.orderSource !== 'direct' &&
          (product as any).isActive === false
        ) {
          throw new BadRequestException(
            `${product.productName} is currently unavailable`,
          );
        }

        const quantity = this.getStockQuantity(
          product.productName,
          Number(item.quantity || 0),
        );

        if (quantity === 0) {
          continue;
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

    const subtotal = (dto.items || []).reduce(
      (sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 1),
      0,
    );
    // Flat delivery fee for every address. Staff-entered (direct) orders may
    // override it; website orders always use the flat fee.
    const deliveryFee =
      dto.orderSource === 'direct' && typeof dto.deliveryFee === 'number'
        ? dto.deliveryFee
        : 300;

    const order = await this.orderModel.create({
      ...dto,
      totalValue: subtotal + deliveryFee,
      deliveryFee,
      customerId: resolvedCustomerId,
    });

    await this.syncOrderIncome(order.toObject());

    await this.usersService.updateFromOrder({
      email: dto.email ?? '',
      customerName: dto.customerName ?? '',
      phone: dto.phone,
      shippingAddress: dto.shippingAddress ?? '',
      manual: dto.orderSource === 'direct',
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
            subtotal,
            deliveryFee,
            paymentMethod: order.paymentMethod,
            paymentSlipUrl: order.paymentSlipUrl,
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
   * Orders placed by the logged-in customer (matched by account email).
   */
  async findForUser(
    userId: string,
    orderId?: string,
  ): Promise<Record<string, any>[]> {
    const user = await this.usersService.findById(userId);

    if (!user?.email) {
      return [];
    }

    const escapedEmail = user.email
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const filter: Record<string, any> = {
      email: { $regex: `^${escapedEmail}$`, $options: 'i' },
    };

    if (orderId) {
      filter.orderId = orderId;
    }

    const orders: OrderDocument[] = await this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();

    return this.attachItemSkus(
      orders.map((order) => order.toObject() as Record<string, any>),
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

    // Admins may move an order to any status (including backwards) to fix mistakes.

    if (
      previousStatus !== 'CANCELED' &&
      nextStatus === 'CANCELED'
    ) {
      await this.restoreStockForOrder(
        order.toObject(),
      );
    }

    if (
      previousStatus === 'CANCELED' &&
      nextStatus !== 'CANCELED'
    ) {
      await this.deductStockForOrder(
        order.toObject(),
      );
    }

    order.status = nextStatus as any;
    if (nextStatus === 'DELIVERED' && previousStatus !== 'DELIVERED') {
      order.deliveredAt = new Date();
    }
    if (dto.adminNote !== undefined) order.adminNote = dto.adminNote;
    if (dto.paymentStatus) order.paymentStatus = dto.paymentStatus;
    if (dto.customerName !== undefined) order.customerName = dto.customerName;
    if (dto.email !== undefined) order.email = dto.email;
    if (dto.phone !== undefined) order.phone = dto.phone;
    if (dto.shippingAddress !== undefined) order.shippingAddress = dto.shippingAddress;

    await order.save();
    await this.syncOrderIncome(order.toObject());

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
    await this.transactionModel
      .deleteOne({ id: this.incomeTxId(order.orderId) })
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
      typeof orderObj.deliveryFee === 'number'
        ? orderObj.deliveryFee
        : orderObj.paymentMethod === 'cod' &&
            orderObj.shippingAddress?.toLowerCase().includes('jaffna')
          ? 300
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
                  item.primaryImage &&
                  typeof item.primaryImage ===
                    'string' &&
                  item.primaryImage.startsWith(
                    'http',
                  )
                ) {
                  try {
                    const base64Image =
                      await this.imageUrlToBase64(
                        item.primaryImage,
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
      paymentMethod: orderObj.paymentMethod,
      paymentStatus: orderObj.paymentStatus,
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