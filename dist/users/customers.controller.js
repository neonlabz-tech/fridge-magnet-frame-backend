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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
let CustomersController = class CustomersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    normalizeCustomerDto(input) {
        const normalized = {
            customerName: input.customerName ?? input.name,
            emailAddress: input.emailAddress ?? input.email,
            phoneNumber: input.phoneNumber ?? input.phone,
            customerAddress: input.customerAddress ?? input.address,
        };
        if (typeof normalized.emailAddress === 'string' && !normalized.emailAddress.trim()) {
            normalized.emailAddress = undefined;
        }
        return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
    }
    async create(createCustomerDto) {
        const normalized = this.normalizeCustomerDto(createCustomerDto);
        const customer = await this.usersService.createCustomer(normalized);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Customer created successfully',
            data: customer,
        };
    }
    async findAll(page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.usersService.findAllCustomers(pageNum, limitNum);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Customers retrieved successfully',
            data: result.data,
            total: result.total,
            activeTotal: result.activeTotal,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    }
    async findByEmail(email) {
        const customer = await this.usersService.findCustomerByEmailAddress(decodeURIComponent(email));
        return {
            statusCode: common_1.HttpStatus.OK,
            message: customer ? 'Customer retrieved successfully' : 'Customer not found',
            data: customer,
        };
    }
    async findOne(id) {
        const customer = await this.usersService.findOneCustomer(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Customer retrieved successfully',
            data: customer,
        };
    }
    async update(id, updateCustomerDto) {
        const customer = await this.usersService.updateCustomer(id, this.normalizeCustomerDto(updateCustomerDto));
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Customer updated successfully',
            data: customer,
        };
    }
    async updateStatus(id, body) {
        const customer = await this.usersService.setCustomerActiveStatus(id, body.isActive, body.source);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: body.isActive
                ? 'Customer enabled successfully'
                : 'Customer disabled successfully',
            data: customer,
        };
    }
    async remove(id) {
        const customer = await this.usersService.removeCustomer(id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Customer deleted successfully',
            data: customer,
        };
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-email/:email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findByEmail", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "remove", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map