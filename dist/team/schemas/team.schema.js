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
exports.TeamRoleSchema = exports.TeamRole = exports.TeamMemberSchema = exports.TeamMember = exports.PAGE_HREFS = exports.TEAM_NAME = exports.DEFAULT_ROLE_NAME = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const clean_json_1 = require("../../common/utils/clean-json");
exports.DEFAULT_ROLE_NAME = 'Business Operator';
exports.TEAM_NAME = 'Business Operator';
exports.PAGE_HREFS = [
    '/dashboard/orders',
    '/dashboard/customers',
    '/dashboard/products',
    '/dashboard/inventory',
    '/dashboard/deliveries',
    '/dashboard/leads',
    '/dashboard/finance',
];
let TeamMember = class TeamMember {
};
exports.TeamMember = TeamMember;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true, unique: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', trim: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "joinDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: exports.DEFAULT_ROLE_NAME }),
    __metadata("design:type", String)
], TeamMember.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['Active', 'Inactive'], default: 'Active' }),
    __metadata("design:type", String)
], TeamMember.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TeamMember.prototype, "passwordHash", void 0);
exports.TeamMember = TeamMember = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, toJSON: (0, clean_json_1.cleanJson)('passwordHash') })
], TeamMember);
exports.TeamMemberSchema = mongoose_1.SchemaFactory.createForClass(TeamMember);
let TeamRole = class TeamRole {
};
exports.TeamRole = TeamRole;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], TeamRole.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], TeamRole.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], TeamRole.prototype, "pages", void 0);
exports.TeamRole = TeamRole = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, toJSON: (0, clean_json_1.cleanJson)() })
], TeamRole);
exports.TeamRoleSchema = mongoose_1.SchemaFactory.createForClass(TeamRole);
//# sourceMappingURL=team.schema.js.map