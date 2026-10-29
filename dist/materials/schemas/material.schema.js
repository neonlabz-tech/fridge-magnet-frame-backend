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
exports.ProductMaterialsSchema = exports.ProductMaterials = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const clean_json_1 = require("../../common/utils/clean-json");
let ProductMaterials = class ProductMaterials {
};
exports.ProductMaterials = ProductMaterials;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], ProductMaterials.prototype, "productKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], ProductMaterials.prototype, "items", void 0);
exports.ProductMaterials = ProductMaterials = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, toJSON: (0, clean_json_1.cleanJson)(), collection: 'productmaterials' })
], ProductMaterials);
exports.ProductMaterialsSchema = mongoose_1.SchemaFactory.createForClass(ProductMaterials);
//# sourceMappingURL=material.schema.js.map