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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const inventory_schema_1 = require("./schemas/inventory.schema");
const clean_json_1 = require("../common/utils/clean-json");
const DEFAULT_ROLE = 'Admin/Director';
let InventoryService = class InventoryService {
    constructor(model) {
        this.model = model;
    }
    statusFilter(status) {
        switch (status) {
            case 'out-of-stock':
                return { stock: { $lte: 0 } };
            case 'low-stock':
                return { stock: { $gt: 0, $lt: inventory_schema_1.LOW_STOCK_LIMIT } };
            case 'in-stock':
                return { stock: { $gte: inventory_schema_1.LOW_STOCK_LIMIT } };
            default:
                return {};
        }
    }
    async findAll(search, status) {
        const filter = this.statusFilter(status);
        if (search?.trim()) {
            const rx = new RegExp((0, clean_json_1.escapeRegex)(search.trim()), 'i');
            filter.$or = [{ id: rx }, { name: rx }];
        }
        const data = await this.model.find(filter).sort({ createdAt: -1 }).exec();
        const all = await this.model.find({}, 'stock').exec();
        return {
            data,
            total: data.length,
            summary: {
                totalItems: all.length,
                lowStock: all.filter((i) => i.stock > 0 && i.stock < inventory_schema_1.LOW_STOCK_LIMIT).length,
                outOfStock: all.filter((i) => i.stock <= 0).length,
            },
        };
    }
    async findOne(id) {
        const item = await this.model.findOne({ id }).exec();
        if (!item)
            throw new common_1.NotFoundException(`Inventory item ${id} not found`);
        return item;
    }
    async create(dto) {
        const ids = (await this.model.find({}, 'id').exec()).map((i) => i.id);
        const id = dto.id && !ids.includes(dto.id) ? dto.id : (0, clean_json_1.nextSequenceId)(ids, 'ITEM-', 4);
        const stock = dto.stock ?? 0;
        const unitValue = dto.unitValue ?? 0;
        const history = dto.history ??
            (stock > 0
                ? [
                    {
                        at: new Date().toISOString(),
                        role: dto.role ?? DEFAULT_ROLE,
                        change: stock,
                        totalValue: stock * unitValue,
                    },
                ]
                : []);
        const item = await this.model.create({
            id,
            name: dto.name,
            stock,
            unitValue,
            history,
        });
        return { message: 'Inventory item created successfully', data: item };
    }
    async update(id, dto) {
        const item = await this.findOne(id);
        const { role, ...fields } = dto;
        if (fields.stock !== undefined && fields.history === undefined && fields.stock !== item.stock) {
            const unitValue = fields.unitValue ?? item.unitValue;
            item.history.push({
                at: new Date().toISOString(),
                role: role ?? DEFAULT_ROLE,
                change: fields.stock - item.stock,
                totalValue: fields.stock * unitValue,
            });
            item.markModified('history');
        }
        Object.assign(item, fields);
        await item.save();
        return { message: 'Inventory item updated successfully', data: item };
    }
    async adjustStock(id, dto) {
        const item = await this.findOne(id);
        const next = item.stock + dto.change;
        if (next < 0) {
            throw new common_1.BadRequestException(`Stock cannot go below zero (current ${item.stock})`);
        }
        item.stock = next;
        item.history.push({
            at: new Date().toISOString(),
            role: dto.role ?? DEFAULT_ROLE,
            change: dto.change,
            totalValue: next * item.unitValue,
        });
        item.markModified('history');
        await item.save();
        return { message: 'Stock adjusted successfully', data: item };
    }
    async remove(id) {
        const item = await this.model.findOneAndDelete({ id }).exec();
        if (!item)
            throw new common_1.NotFoundException(`Inventory item ${id} not found`);
        return { message: 'Inventory item deleted successfully', data: item };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(inventory_schema_1.InventoryItem.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map