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
exports.TransactionSchema = exports.Transaction = exports.TX_STATUSES = exports.TX_METHODS = exports.TX_KINDS = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const clean_json_1 = require("../../common/utils/clean-json");
exports.TX_KINDS = ['income', 'expense'];
exports.TX_METHODS = ['Bank Transfer', 'Cash', 'Card Payment'];
exports.TX_STATUSES = ['completed', 'pending'];
let Transaction = class Transaction {
};
exports.Transaction = Transaction;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Transaction.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.TX_KINDS }),
    __metadata("design:type", String)
], Transaction.prototype, "kind", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], Transaction.prototype, "ref", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], Transaction.prototype, "party", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], Transaction.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.TX_METHODS, default: 'Cash' }),
    __metadata("design:type", String)
], Transaction.prototype, "method", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.TX_STATUSES, default: 'completed' }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Transaction.prototype, "createdBy", void 0);
exports.Transaction = Transaction = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, toJSON: (0, clean_json_1.cleanJson)() })
], Transaction);
exports.TransactionSchema = mongoose_1.SchemaFactory.createForClass(Transaction);
exports.TransactionSchema.index({ kind: 1, date: -1 });
//# sourceMappingURL=transaction.schema.js.map