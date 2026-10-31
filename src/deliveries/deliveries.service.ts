import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Delivery, DeliveryDocument } from './schemas/delivery.schema';
import { Order, OrderDocument, OrderStatus } from '../orders/schemas/order.schema';
import {
  BulkDeliveryStatusDto,
  CreateDeliveryDto,
  UpdateDeliveryDto,
} from './dto/delivery.dto';
import { escapeRegex } from '../common/utils/clean-json';
import { OrdersService } from '../orders/orders.service';

const FIRST_SEQUENCE = 260913;

/** Mirrors the frontend dispatch configuration (drivers / time slots are not records). */
export const DRIVERS = ['S. Sasikaran', 'K. Srinivasan', 'M. Dilkesh', 'E. Niroshan'];
export const TIME_SLOTS = [
  '09:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 05:00 PM',
  '05:00 PM - 08:00 PM',
];

export interface DeliveryQuery {
  status?: string;
  method?: string;
  driver?: string;
  search?: string;
}

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectModel(Delivery.name)
    private readonly model: Model<DeliveryDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly ordersService: OrdersService,
  ) {}

  private readonly logger = new Logger(DeliveriesService.name);

  /**
   * Keeps the order in step with its delivery: Delivered -> order Delivered + Paid,
   * In Transit / Pending -> order Shipped (a COD order that was marked paid by the
   * delivery goes back to pending payment). Income is synced by the orders service.
   */
  private async syncOrderFromDelivery(orderId?: string, status?: string) {
    if (!orderId || !status) return;
    try {
      const bare = orderId.replace(/^#/, '');
      const order =
        (await this.orderModel.findOne({ orderId }).exec()) ||
        (await this.orderModel.findOne({ orderId: bare }).exec()) ||
        (await this.orderModel.findOne({ orderId: `#${bare}` }).exec());
      if (!order || order.status === OrderStatus.CANCELED) return;

      if (status === 'delivered') {
        if (order.status === OrderStatus.DELIVERED && order.paymentStatus === 'paid') return;
        await this.ordersService.updateStatus(String(order._id), {
          status: OrderStatus.DELIVERED,
          paymentStatus: 'paid',
        } as any);
      } else if (status === 'in-transit' || status === 'pending') {
        if (order.status === OrderStatus.SHIPPED) return;
        const wasDelivered = order.status === OrderStatus.DELIVERED;
        const cod = String(order.paymentMethod ?? '').toLowerCase().includes('cod');
        await this.ordersService.updateStatus(String(order._id), {
          status: OrderStatus.SHIPPED,
          ...(wasDelivered && cod ? { paymentStatus: 'pending' } : {}),
        } as any);
      }
    } catch (err) {
      this.logger.error(`Could not sync order ${orderId} with delivery status ${status}: ${(err as Error).message}`);
    }
  }

  options() {
    return { drivers: DRIVERS, timeSlots: TIME_SLOTS };
  }

  private async nextId() {
    const ids = (await this.model.find({}, 'id').exec()).map((d) => d.id);
    const max = ids.reduce((m, id) => {
      const n = Number(id.replace(/\D/g, ''));
      return Number.isFinite(n) && n > m ? n : m;
    }, FIRST_SEQUENCE - 1);
    return `MGD-${max + 1}`;
  }

  async findAll(q: DeliveryQuery) {
    const filter: Record<string, any> = {};
    if (q.status) filter.status = q.status;
    if (q.method) filter.method = q.method;
    if (q.driver) filter.driver = q.driver;
    if (q.search?.trim()) {
      const rx = new RegExp(escapeRegex(q.search.trim()), 'i');
      filter.$or = [
        { id: rx },
        { orderId: rx },
        { tracking: rx },
        { recipient: rx },
        { place: rx },
      ];
    }

    const data = await this.model.find(filter).sort({ createdAt: -1 }).exec();
    return { data, total: data.length };
  }

  /** Orders that still need a delivery (status SHIPPED and not already dispatched). */
  async dispatchOrders() {
    const dispatched = await this.model
      .find({ status: { $ne: 'returned' } }, 'orderId')
      .exec();
    const taken = new Set(dispatched.map((d) => d.orderId));

    const orders = await this.orderModel
      .find({ status: OrderStatus.SHIPPED })
      .sort({ createdAt: -1 })
      .exec();

    const data = orders
      .filter((o) => !taken.has(o.orderId))
      .map((o) => ({
        orderId: o.orderId,
        badge: 'Ready to Dispatch',
        total: o.totalValue,
        customer: o.customerName,
        phone: o.phone ?? '',
        place: o.district ?? '',
        address: o.shippingAddress ?? '',
      }));

    return { data, total: data.length };
  }

  /** Ids are stored as MGD-260913; accept the #-prefixed spelling too. */
  private ids(id: string): string[] {
    const bare = id.replace(/^#/, '');
    return [bare, `#${bare}`];
  }

  async findOne(id: string) {
    const delivery = await this.model.findOne({ id: { $in: this.ids(id) } }).exec();
    if (!delivery) throw new NotFoundException(`Delivery ${id} not found`);
    return delivery;
  }

  async create(dto: CreateDeliveryDto) {
    const taken = dto.id ? await this.model.exists({ id: dto.id }) : true;
    const id = dto.id && !taken ? dto.id : await this.nextId();
    const delivery = await this.model.create({ ...dto, id });
    await this.syncOrderFromDelivery(delivery.orderId, delivery.status);
    return { message: 'Delivery created successfully', data: delivery };
  }

  async update(id: string, dto: UpdateDeliveryDto) {
    const delivery = await this.model
      .findOneAndUpdate({ id: { $in: this.ids(id) } }, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!delivery) throw new NotFoundException(`Delivery ${id} not found`);
    await this.syncOrderFromDelivery(delivery.orderId, delivery.status);
    return { message: 'Delivery updated successfully', data: delivery };
  }

  updateStatus(id: string, status: string) {
    return this.update(id, { status });
  }

  async bulkUpdateStatus(dto: BulkDeliveryStatusDto) {
    const result = await this.model
      .updateMany({ id: { $in: dto.ids } }, { $set: { status: dto.status } })
      .exec();
    const list = await this.model.find({ id: { $in: dto.ids } }, 'orderId').exec();
    for (const d of list) await this.syncOrderFromDelivery(d.orderId, dto.status);
    return {
      message: 'Deliveries updated successfully',
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  }

  async remove(id: string) {
    const delivery = await this.model.findOneAndDelete({ id: { $in: this.ids(id) } }).exec();
    if (!delivery) throw new NotFoundException(`Delivery ${id} not found`);
    return { message: 'Delivery deleted successfully', data: delivery };
  }
}
