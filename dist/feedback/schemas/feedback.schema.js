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
exports.FeedbackSchema = exports.Feedback = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Feedback = class Feedback {
};
exports.Feedback = Feedback;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Feedback.prototype, "orderNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Feedback.prototype, "customerName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Feedback.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 5, default: 0 }),
    __metadata("design:type", Number)
], Feedback.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Feedback.prototype, "comment", void 0);
exports.Feedback = Feedback = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Feedback);
exports.FeedbackSchema = mongoose_1.SchemaFactory.createForClass(Feedback);
//# sourceMappingURL=feedback.schema.js.map