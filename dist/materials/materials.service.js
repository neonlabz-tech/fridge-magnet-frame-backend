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
exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const material_schema_1 = require("./schemas/material.schema");
let MaterialsService = class MaterialsService {
    constructor(model) {
        this.model = model;
    }
    async findAll() {
        const list = await this.model.find().exec();
        const data = Object.fromEntries(list.map((m) => [m.productKey, m.items]));
        return { data, total: list.length };
    }
    async findOne(productKey) {
        const doc = await this.model.findOne({ productKey }).exec();
        return { data: doc?.items ?? [] };
    }
    async save(productKey, dto) {
        const items = dto.items.filter((i) => i.qty > 0);
        if (!items.length) {
            await this.model.deleteOne({ productKey }).exec();
            return { message: 'Materials cleared', data: [] };
        }
        const doc = await this.model
            .findOneAndUpdate({ productKey }, { $set: { items } }, { new: true, upsert: true, setDefaultsOnInsert: true })
            .exec();
        return { message: 'Materials saved successfully', data: doc.items };
    }
    async remove(productKey) {
        await this.model.deleteOne({ productKey }).exec();
        return { message: 'Materials removed successfully' };
    }
};
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(material_schema_1.ProductMaterials.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MaterialsService);
//# sourceMappingURL=materials.service.js.map