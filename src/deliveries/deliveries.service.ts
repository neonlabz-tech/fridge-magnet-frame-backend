import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

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

  /** Orders that still need a delivery (not cancelled/delivered and not already dispatched). */
  async dispatchOrders() {
    const dispatched = await this.model
      .find({ status: { $ne: 'returned' } }, 'orderId')
      .exec();
    const taken = new Set(dispatched.map((d) => d.orderId));

    const orders = await this.orderModel
      .find({ status: { $in: [OrderStatus.PENDING, OrderStatus.PROCESSING] } })
      .sort({ createdAt: -1 })
      .exec();

    const data = orders
      .filter((o) => !taken.has(o.orderId))
      .map((o) => ({
        orderId: o.orderId,
        badge: o.status === OrderStatus.PROCESSING ? 'Ready to Dispatch' : 'Pending Pack',
        total: o.totalValue,
        customer: o.customerName,
        phone: o.phone ?? '',
        place: o.district ?? '',
        address: o.shippingAddress ?? '',
      }));

    return { data, total: data.length };
  }

  async findOne(id: string) {
    const delivery = await this.model.findOne({ id }).exec();
    if (!delivery) throw new NotFoundException(`Delivery ${id} not found`);
    return delivery;
  }

  async create(dto: CreateDeliveryDto) {
    const taken = dto.id ? await this.model.exists({ id: dto.id }) : true;
    const id = dto.id && !taken ? dto.id : await this.nextId();
    const delivery = await this.model.create({ ...dto, id });
    return { message: 'Delivery created successfully', data: delivery };
  }

  async update(id: string, dto: UpdateDeliveryDto) {
    const delivery = await this.model
      .findOneAndUpdate({ id }, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!delivery) throw new NotFoundException(`Delivery ${id} not found`);
    return { message: 'Delivery updated successfully', data: delivery };
  }

  updateStatus(id: string, status: string) {
    return this.update(id, { status });
  }

  async bulkUpdateStatus(dto: BulkDeliveryStatusDto) {
    const result = await this.model
      .updateMany({ id: { $in: dto.ids } }, { $set: { status: dto.status } })
      .exec();
    return {
      message: 'Deliveries updated successfully',
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  }

  async remove(id: string) {
    const delivery = await this.model.findOneAndDelete({ id }).exec();
    if (!delivery) throw new NotFoundException(`Delivery ${id} not found`);
    return { message: 'Delivery deleted successfully', data: delivery };
  }
}
