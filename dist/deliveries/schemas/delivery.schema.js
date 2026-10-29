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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliverySchema = exports.Delivery = exports.DELIVERY_METHODS = exports.DELIVERY_STATUSES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const clean_json_1 = require("../../common/utils/clean-json");
exports.DELIVERY_STATUSES = ['pending', 'in-transit', 'delivered', 'returned'];
exports.DELIVERY_METHODS = ['Standard', 'Courier'];
let Delivery = class Delivery {
};
exports.Delivery = Delivery;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Delivery.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Delivery.prototype, "orderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Delivery.prototype, "orderTotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.DELIVERY_METHODS, default: 'Standard' }),
    __metadata("design:type", String)
], Delivery.prototype, "method", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "tracking", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "driver", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "place", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "recipient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "timeSlot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.DELIVERY_STATUSES, default: 'pending' }),
    __metadata("design:type", String)
], Delivery.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "vehicleType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "licenseNo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "plateNo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Delivery.prototype, "emergencyContact", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Delivery.prototype, "zones", void 0);
exports.Delivery = Delivery = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, toJSON: (0, clean_json_1.cleanJson)() })
], Delivery);
exports.DeliverySchema = mongoose_1.SchemaFactory.createForClass(Delivery);
exports.DeliverySchema.index({ orderId: 1 });
exports.DeliverySchema.index({ status: 1, date: -1 });
//# sourceMappingURL=delivery.schema.js.map