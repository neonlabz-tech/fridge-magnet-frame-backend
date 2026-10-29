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
exports.ProductSchema = exports.Product = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Product = class Product {
};
exports.Product = Product;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Product.prototype, "productName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ unique: true, sparse: true, trim: true, lowercase: true }),
    __metadata("design:type", String)
], Product.prototype, "productNameKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Product.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "stock", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Product.prototype, "imagecount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "manufactureCost", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                label: { type: String, required: true },
                image: {
                    type: {
                        secure_url: { type: String },
                        public_id: { type: String },
                    },
                    default: null,
                },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Product.prototype, "personalization", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['In Stock', 'Low Stock', 'Out of Stock'],
        default: 'In Stock',
    }),
    __metadata("design:type", String)
], Product.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            secure_url: String,
            public_id: String,
        },
        default: null,
    }),
    __metadata("design:type", Object)
], Product.prototype, "primaryImage", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                secure_url: String,
                public_id: String,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Product.prototype, "galleryImages", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                previousStock: { type: Number, required: true },
                newStock: { type: Number, required: true },
                changedBy: { type: String, default: 'Admin' },
                changedAt: { type: Date, default: Date.now },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Product.prototype, "stockHistory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
exports.Product = Product = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Product);
exports.ProductSchema = mongoose_1.SchemaFactory.createForClass(Product);
exports.ProductSchema.index({ productNameKey: 1 }, { unique: true, sparse: true });
//# sourceMappingURL=product.schema.js.map