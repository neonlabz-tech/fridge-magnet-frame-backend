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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("./schemas/transaction.schema");
const clean_json_1 = require("../common/utils/clean-json");
let FinanceService = class FinanceService {
    constructor(model) {
        this.model = model;
    }
    buildFilter(q) {
        const filter = {};
        if (q.kind)
            filter.kind = q.kind;
        if (q.status)
            filter.status = q.status;
        if (q.createdBy)
            filter.createdBy = q.createdBy;
        if (q.from || q.to) {
            filter.date = {
                ...(q.from ? { $gte: q.from } : {}),
                ...(q.to ? { $lte: q.to } : {}),
            };
        }
        if (q.search?.trim()) {
            const rx = new RegExp((0, clean_json_1.escapeRegex)(q.search.trim()), 'i');
            filter.$or = [{ id: rx }, { ref: rx }, { party: rx }, { note: rx }];
        }
        return filter;
    }
    async findAll(q) {
        const filter = this.buildFilter(q);
        const data = await this.model.find(filter).sort({ date: -1, createdAt: -1 }).exec();
        return { data, total: data.length, summary: this.summarise(data) };
    }
    async summary(q) {
        const data = await this.model.find(this.buildFilter(q)).exec();
        return this.summarise(data);
    }
    summarise(list) {
        const sum = (kind) => list
            .filter((t) => t.kind === kind && t.status === 'completed')
            .reduce((a, t) => a + t.amount, 0);
        const totalIncome = sum('income');
        const totalExpense = sum('expense');
        return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
    }
    async findOne(id) {
        const tx = await this.model.findOne({ id }).exec();
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${id} not found`);
        return tx;
    }
    async create(dto) {
        const ids = (await this.model.find({}, 'id').exec()).map((t) => t.id);
        const id = dto.id && !ids.includes(dto.id) ? dto.id : (0, clean_json_1.nextSequenceId)(ids, 'TXN-', 5);
        const tx = await this.model.create({ ...dto, id });
        return { message: 'Transaction recorded successfully', data: tx };
    }
    async update(id, dto) {
        const tx = await this.model
            .findOneAndUpdate({ id }, { $set: dto }, { new: true, runValidators: true })
            .exec();
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${id} not found`);
        return { message: 'Transaction updated successfully', data: tx };
    }
    async remove(id) {
        const tx = await this.model.findOneAndDelete({ id }).exec();
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${id} not found`);
        return { message: 'Transaction deleted successfully', data: tx };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], FinanceService);
//# sourceMappingURL=finance.service.js.map