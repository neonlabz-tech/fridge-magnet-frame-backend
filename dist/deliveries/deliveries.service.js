"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DeliveriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveriesService = exports.TIME_SLOTS = exports.DRIVERS = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const delivery_schema_1 = require("./schemas/delivery.schema");
const order_schema_1 = require("../orders/schemas/order.schema");
const clean_json_1 = require("../common/utils/clean-json");
const orders_service_1 = require("../orders/orders.service");
const FIRST_SEQUENCE = 260913;
exports.DRIVERS = ['S. Sasikaran', 'K. Srinivasan', 'M. Dilkesh', 'E. Niroshan'];
exports.TIME_SLOTS = [
    '09:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 05:00 PM',
    '05:00 PM - 08:00 PM',
];
let DeliveriesService = DeliveriesService_1 = class DeliveriesService {
    constructor(model, orderModel, ordersService) {
        this.model = model;
        this.orderModel = orderModel;
        this.ordersService = ordersService;
        this.logger = new common_1.Logger(DeliveriesService_1.name);
    }
    async syncOrderFromDelivery(orderId, status) {
        if (!orderId || !status)
            return;
        try {
            const bare = orderId.replace(/^#/, '');
            const order = (await this.orderModel.findOne({ orderId }).exec()) ||
                (await this.orderModel.findOne({ orderId: bare }).exec()) ||
                (await this.orderModel.findOne({ orderId: `#${bare}` }).exec());
            if (!order || order.status === order_schema_1.OrderStatus.CANCELED)
                return;
            if (status === 'delivered') {
                if (order.status === order_schema_1.OrderStatus.DELIVERED && order.paymentStatus === 'paid')
                    return;
                await this.ordersService.updateStatus(String(order._id), {
                    status: order_schema_1.OrderStatus.DELIVERED,
                    paymentStatus: 'paid',
                });
            }
            else if (status === 'in-transit' || status === 'pending') {
                if (order.status === order_schema_1.OrderStatus.SHIPPED)
                    return;
                const wasDelivered = order.status === order_schema_1.OrderStatus.DELIVERED;
                const cod = String(order.paymentMethod ?? '').toLowerCase().includes('cod');
                await this.ordersService.updateStatus(String(order._id), {
                    status: order_schema_1.OrderStatus.SHIPPED,
                    ...(wasDelivered && cod ? { paymentStatus: 'pending' } : {}),
                });
            }
        }
        catch (err) {
            this.logger.error(`Could not sync order ${orderId} with delivery status ${status}: ${err.message}`);
        }
    }
    options() {
        return { drivers: exports.DRIVERS, timeSlots: exports.TIME_SLOTS };
    }
    async nextId() {
        const ids = (await this.model.find({}, 'id').exec()).map((d) => d.id);
        const max = ids.reduce((m, id) => {
            const n = Number(id.replace(/\D/g, ''));
            return Number.isFinite(n) && n > m ? n : m;
        }, FIRST_SEQUENCE - 1);
        return `MGD-${max + 1}`;
    }
    async findAll(q) {
        const filter = {};
        if (q.status)
            filter.status = q.status;
        if (q.method)
            filter.method = q.method;
        if (q.driver)
            filter.driver = q.driver;
        if (q.search?.trim()) {
            const rx = new RegExp((0, clean_json_1.escapeRegex)(q.search.trim()), 'i');
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
    async dispatchOrders() {
        const dispatched = await this.model
            .find({ status: { $ne: 'returned' } }, 'orderId')
            .exec();
        const taken = new Set(dispatched.map((d) => d.orderId));
        const orders = await this.orderModel
            .find({ status: order_schema_1.OrderStatus.SHIPPED })
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
    ids(id) {
        const bare = id.replace(/^#/, '');
        return [bare, `#${bare}`];
    }
    async findOne(id) {
        const delivery = await this.model.findOne({ id: { $in: this.ids(id) } }).exec();
        if (!delivery)
            throw new common_1.NotFoundException(`Delivery ${id} not found`);
        return delivery;
    }
    async create(dto) {
        const taken = dto.id ? await this.model.exists({ id: dto.id }) : true;
        const id = dto.id && !taken ? dto.id : await this.nextId();
        const delivery = await this.model.create({ ...dto, id });
        await this.syncOrderFromDelivery(delivery.orderId, delivery.status);
        return { message: 'Delivery created successfully', data: delivery };
    }
    async update(id, dto) {
        const delivery = await this.model
            .findOneAndUpdate({ id: { $in: this.ids(id) } }, { $set: dto }, { new: true, runValidators: true })
            .exec();
        if (!delivery)
            throw new common_1.NotFoundException(`Delivery ${id} not found`);
        await this.syncOrderFromDelivery(delivery.orderId, delivery.status);
        return { message: 'Delivery updated successfully', data: delivery };
    }
    updateStatus(id, status) {
        return this.update(id, { status });
    }
    async bulkUpdateStatus(dto) {
        const result = await this.model
            .updateMany({ id: { $in: dto.ids } }, { $set: { status: dto.status } })
            .exec();
        const list = await this.model.find({ id: { $in: dto.ids } }, 'orderId').exec();
        for (const d of list)
            await this.syncOrderFromDelivery(d.orderId, dto.status);
        return {
            message: 'Deliveries updated successfully',
            matched: result.matchedCount,
            modified: result.modifiedCount,
        };
    }
    async remove(id) {
        const delivery = await this.model.findOneAndDelete({ id: { $in: this.ids(id) } }).exec();
        if (!delivery)
            throw new common_1.NotFoundException(`Delivery ${id} not found`);
        return { message: 'Delivery deleted successfully', data: delivery };
    }
};
exports.DeliveriesService = DeliveriesService;
exports.DeliveriesService = DeliveriesService = DeliveriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(delivery_schema_1.Delivery.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        orders_service_1.OrdersService])
], DeliveriesService);
//# sourceMappingURL=deliveries.service.js.map