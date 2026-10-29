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
var OrdersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const create_order_dto_1 = require("./dto/create-order.dto");
const update_order_status_dto_1 = require("./dto/update-order-status.dto");
const orders_service_1 = require("./orders.service");
let OrdersController = OrdersController_1 = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
        this.logger = new common_1.Logger(OrdersController_1.name);
    }
    create(dto) {
        return this.ordersService.create(dto);
    }
    syncIncome() {
        return this.ordersService.backfillOrderIncomes();
    }
    async findAll(status, search) {
        return this.ordersService.findAll(status, search);
    }
    async downloadPhoto(url, name, res) {
        const photo = await this.ordersService.fetchCustomerPhoto(url);
        const safeName = String(name || 'photo').replace(/[^\w.\-]+/g, '_');
        res.set({
            'Content-Type': photo.contentType,
            'Content-Disposition': `attachment; filename="${safeName}"`,
            'Cache-Control': 'no-store',
        });
        res.send(photo.buffer);
    }
    findMine(req) {
        return this.ordersService.findForUser(req.user.userId);
    }
    async findMyOrder(req, orderId) {
        const [order] = await this.ordersService.findForUser(req.user.userId, orderId);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async findOne(id) {
        return this.ordersService.findOne(id);
    }
    updateStatus(id, dto) {
        return this.ordersService.updateStatus(id, dto);
    }
    deleteCustomerImages(id) {
        return this.ordersService.deleteCustomerImages(id);
    }
    delete(id) {
        return this.ordersService.delete(id);
    }
    async downloadReceipt(orderNumber, res) {
        try {
            const receipt = await this.ordersService.generateReceipt(orderNumber);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="receipt-${orderNumber}.pdf"`);
            res.setHeader('Content-Length', receipt.length.toString());
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Accept-Ranges', 'bytes');
            res.status(200);
            return res.send(receipt);
        }
        catch (error) {
            this.logger.error(`Failed to generate receipt for ${orderNumber}:`, error);
            return res.status(500).json({
                error: 'Failed to generate receipt',
                message: 'Unable to generate PDF receipt. Please try again.',
                orderNumber,
            });
        }
    }
    async getReceiptStatus(orderNumber) {
        try {
            const order = await this.ordersService.findByOrderId(orderNumber);
            return {
                success: true,
                message: 'Receipt is ready for download',
                orderId: order.orderId,
                customerName: order.customerName,
                status: order.status,
                downloadUrl: `/orders/${orderNumber}/receipt`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Order not found or receipt unavailable',
                error: error instanceof Error
                    ? error.message
                    : 'Unknown error',
            };
        }
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('sync-income'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "syncIncome", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('photos/download'),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Query)('name')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "downloadPhoto", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findMine", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my/:orderId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findMyOrder", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_order_status_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id/customer-images'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "deleteCustomerImages", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':orderNumber/receipt'),
    __param(0, (0, common_1.Param)('orderNumber')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "downloadReceipt", null);
__decorate([
    (0, common_1.Get)(':orderNumber/receipt/status'),
    __param(0, (0, common_1.Param)('orderNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getReceiptStatus", null);
exports.OrdersController = OrdersController = OrdersController_1 = __decorate([
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map