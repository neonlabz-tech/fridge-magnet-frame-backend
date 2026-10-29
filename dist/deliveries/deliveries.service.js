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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveriesService = exports.TIME_SLOTS = exports.DRIVERS = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const delivery_schema_1 = require("./schemas/delivery.schema");
const order_schema_1 = require("../orders/schemas/order.schema");
const clean_json_1 = require("../common/utils/clean-json");
const FIRST_SEQUENCE = 260913;
exports.DRIVERS = ['S. Sasikaran', 'K. Srinivasan', 'M. Dilkesh', 'E. Niroshan'];
exports.TIME_SLOTS = [
    '09:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 05:00 PM',
    '05:00 PM - 08:00 PM',
];
let DeliveriesService = class DeliveriesService {
    constructor(model, orderModel) {
        this.model = model;
        this.orderModel = orderModel;
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
            .find({ status: { $in: [order_schema_1.OrderStatus.PENDING, order_schema_1.OrderStatus.PROCESSING] } })
            .sort({ createdAt: -1 })
            .exec();
        const data = orders
            .filter((o) => !taken.has(o.orderId))
            .map((o) => ({
            orderId: o.orderId,
            badge: o.status === order_schema_1.OrderStatus.PROCESSING ? 'Ready to Dispatch' : 'Pending Pack',
            total: o.totalValue,
            customer: o.customerName,
            phone: o.phone ?? '',
            place: o.district ?? '',
            address: o.shippingAddress ?? '',
        }));
        return { data, total: data.length };
    }
    async findOne(id) {
        const delivery = await this.model.findOne({ id }).exec();
        if (!delivery)
            throw new common_1.NotFoundException(`Delivery ${id} not found`);
        return delivery;
    }
    async create(dto) {
        const taken = dto.id ? await this.model.exists({ id: dto.id }) : true;
        const id = dto.id && !taken ? dto.id : await this.nextId();
        const delivery = await this.model.create({ ...dto, id });
        return { message: 'Delivery created successfully', data: delivery };
    }
    async update(id, dto) {
        const delivery = await this.model
            .findOneAndUpdate({ id }, { $set: dto }, { new: true, runValidators: true })
            .exec();
        if (!delivery)
            throw new common_1.NotFoundException(`Delivery ${id} not found`);
        return { message: 'Delivery updated successfully', data: delivery };
    }
    updateStatus(id, status) {
        return this.update(id, { status });
    }
    async bulkUpdateStatus(dto) {
        const result = await this.model
            .updateMany({ id: { $in: dto.ids } }, { $set: { status: dto.status } })
            .exec();
        return {
            message: 'Deliveries updated successfully',
            matched: result.matchedCount,
            modified: result.modifiedCount,
        };
    }
    async remove(id) {
        const delivery = await this.model.findOneAndDelete({ id }).exec();
        if (!delivery)
            throw new common_1.NotFoundException(`Delivery ${id} not found`);
        return { message: 'Delivery deleted successfully', data: delivery };
    }
};
exports.DeliveriesService = DeliveriesService;
exports.DeliveriesService = DeliveriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(delivery_schema_1.Delivery.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], DeliveriesService);
//# sourceMappingURL=deliveries.service.js.map