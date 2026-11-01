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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const order_schema_1 = require("./schemas/order.schema");
const cloudflareR2_service_1 = require("../cloudflareR2/cloudflareR2.service");
const transaction_schema_1 = require("../finance/schemas/transaction.schema");
const product_schema_1 = require("../products/schemas/product.schema");
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const pdf_generator_service_1 = require("./services/pdf-generator.service");
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(orderModel, productModel, transactionModel, usersService, mailService, pdfGeneratorService, cloudflareR2Service) {
        this.orderModel = orderModel;
        this.productModel = productModel;
        this.transactionModel = transactionModel;
        this.usersService = usersService;
        this.mailService = mailService;
        this.pdfGeneratorService = pdfGeneratorService;
        this.cloudflareR2Service = cloudflareR2Service;
        this.logger = new common_1.Logger(OrdersService_1.name);
    }
    incomeTxId(orderId) {
        return `ORDINC-${String(orderId).replace(/^#+/, '')}`;
    }
    incomeMethod(method) {
        const m = String(method ?? '').toLowerCase();
        if (m.includes('bank'))
            return 'Bank Transfer';
        if (m.includes('card'))
            return 'Card Payment';
        return 'Cash';
    }
    async syncOrderIncome(order) {
        try {
            const id = this.incomeTxId(order.orderId);
            const paid = String(order.paymentStatus ?? '').toLowerCase() === 'paid' &&
                String(order.status ?? '').toUpperCase() !== 'CANCELED' &&
                Number(order.totalValue ?? 0) > 0;
            if (!paid) {
                await this.transactionModel.deleteOne({ id }).exec();
                return;
            }
            const existing = await this.transactionModel.findOne({ id }).exec();
            const fields = {
                kind: 'income',
                ref: order.orderId,
                party: order.customerName ?? '',
                note: 'Order payment (auto)',
                amount: Number(order.totalValue ?? 0),
                method: this.incomeMethod(order.paymentMethod),
                status: 'completed',
            };
            if (existing) {
                await this.transactionModel.updateOne({ id }, { $set: fields }).exec();
                return;
            }
            await this.transactionModel.create({
                id,
                date: new Date().toISOString().slice(0, 10),
                createdBy: 'admin',
                ...fields,
            });
        }
        catch (err) {
            this.logger.error(`[Orders] Could not sync finance income for ${order.orderId}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    async backfillOrderIncomes() {
        const orders = await this.orderModel
            .find({ paymentStatus: 'paid', status: { $ne: order_schema_1.OrderStatus.CANCELED } })
            .exec();
        let created = 0;
        let skipped = 0;
        for (const o of orders) {
            const id = this.incomeTxId(o.orderId);
            const already = await this.transactionModel
                .findOne({ $or: [{ id }, { kind: 'income', ref: o.orderId }] })
                .exec();
            if (already) {
                skipped += 1;
                continue;
            }
            await this.syncOrderIncome(o.toObject());
            created += 1;
        }
        return { created, skipped };
    }
    onModuleInit() {
        this.photoStartTimer = setTimeout(() => void this.purgeExpiredCustomerImages(), 60_000);
        this.photoTimer = setInterval(() => void this.purgeExpiredCustomerImages(), 60 * 60 * 1000);
        this.photoStartTimer.unref?.();
        this.photoTimer.unref?.();
    }
    onModuleDestroy() {
        if (this.photoStartTimer)
            clearTimeout(this.photoStartTimer);
        if (this.photoTimer)
            clearInterval(this.photoTimer);
    }
    customerImageKey(url) {
        const base = String(process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
        if (!base || typeof url !== 'string' || !url.startsWith(`${base}/`))
            return null;
        try {
            const key = url
                .slice(base.length + 1)
                .split(/[?#]/)[0]
                .split('/')
                .map(decodeURIComponent)
                .join('/');
            return key.startsWith('orders/') && !key.includes('..') ? key : null;
        }
        catch {
            return null;
        }
    }
    async purgeCustomerImages(order) {
        let deleted = 0;
        let failed = 0;
        const items = (order.items ?? []).map((item) => ({ ...item }));
        for (const item of items) {
            const kept = [];
            for (const url of item.uploadedImages ?? []) {
                const key = this.customerImageKey(url);
                if (!key) {
                    kept.push(url);
                    continue;
                }
                try {
                    await this.cloudflareR2Service.deleteImage(key);
                    deleted += 1;
                }
                catch (err) {
                    failed += 1;
                    kept.push(url);
                    this.logger.warn(`[Orders] Could not delete ${key} of ${order.orderId}: ${err}`);
                }
            }
            item.uploadedImages = kept;
        }
        order.items = items;
        order.markModified('items');
        if (failed === 0)
            order.imagesDeletedAt = new Date();
        await order.save();
        return { deleted, failed };
    }
    async purgeExpiredCustomerImages() {
        try {
            const days = Number(process.env.CUSTOMER_IMAGE_RETENTION_DAYS ?? 3) || 3;
            const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const filter = {
                status: order_schema_1.OrderStatus.DELIVERED,
                imagesDeletedAt: { $exists: false },
                $or: [
                    { deliveredAt: { $lte: cutoff } },
                    { deliveredAt: { $exists: false }, updatedAt: { $lte: cutoff } },
                ],
            };
            const orders = await this.orderModel.find(filter).limit(50).exec();
            for (const order of orders) {
                const { deleted } = await this.purgeCustomerImages(order);
                if (deleted)
                    this.logger.log(`[Orders] Removed ${deleted} customer photo(s) of ${order.orderId}`);
            }
        }
        catch (err) {
            this.logger.error(`[Orders] Customer photo clean-up failed: ${err}`);
        }
    }
    async fetchCustomerPhoto(url) {
        if (!this.customerImageKey(url)) {
            throw new common_1.BadRequestException('Not a customer photo.');
        }
        try {
            const response = await axios_1.default.get(url, { responseType: 'arraybuffer', timeout: 20000 });
            return {
                buffer: Buffer.from(response.data),
                contentType: String(response.headers['content-type'] || 'application/octet-stream'),
            };
        }
        catch {
            throw new common_1.NotFoundException('Photo not found. It may have been deleted.');
        }
    }
    async deleteCustomerImages(id) {
        let order = null;
        if (mongoose_2.Types.ObjectId.isValid(id))
            order = await this.orderModel.findById(id).exec();
        if (!order)
            order = await this.orderModel.findOne({ orderId: id }).exec();
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (this.normalizeOrderStatus(order.status) !== 'DELIVERED') {
            throw new common_1.BadRequestException('Customer photos can be deleted only after the order is delivered.');
        }
        const { deleted, failed } = await this.purgeCustomerImages(order);
        if (failed > 0) {
            throw new common_1.BadRequestException(`${failed} photo(s) could not be deleted. Please try again.`);
        }
        const [enriched] = await this.attachItemSkus([order.toObject()]);
        return { message: `${deleted} photo(s) deleted`, deleted, data: enriched };
    }
    normalizeCustomerId(value) {
        return String(value ?? '')
            .replace(/^#+/, '')
            .trim();
    }
    async resolveOrderCustomerId(order) {
        const directValue = this.normalizeCustomerId(order.customerId);
        if (!order.email) {
            return directValue;
        }
        const user = await this.usersService.findByEmail(order.email.trim().toLowerCase());
        if (user?.customerId) {
            return this.normalizeCustomerId(user.customerId);
        }
        return directValue;
    }
    getStatusFromStock(stock) {
        if (stock > 10)
            return 'In Stock';
        if (stock > 0)
            return 'Low Stock';
        return 'Out of Stock';
    }
    getStockQuantity(productName, requestedQuantity) {
        const magnetCount = productName.match(/(\d+)\s*magnets?/i);
        return magnetCount
            ? Number(magnetCount[1])
            : Math.max(requestedQuantity, 0);
    }
    async restoreStockForOrder(order) {
        if (!order?.items?.length) {
            return;
        }
        for (const item of order.items) {
            if (!item.productId) {
                continue;
            }
            const quantity = Math.max(Number(item.quantity || 0), 0);
            if (quantity === 0) {
                continue;
            }
            const product = mongoose_2.Types.ObjectId.isValid(item.productId)
                ? await this.productModel.findById(item.productId)
                : await this.productModel.findOne({
                    productId: item.productId,
                });
            if (!product) {
                this.logger.warn(`[Orders] Product ${item.productId} not found while restoring stock`);
                continue;
            }
            const previousStock = Number(product.stock || 0);
            const newStock = previousStock + quantity;
            product.stock = newStock;
            product.status = this.getStatusFromStock(newStock);
            product.updatedAt = new Date();
            if (Array.isArray(product.stockHistory)) {
                product.stockHistory.push({
                    previousStock,
                    newStock,
                    changedBy: 'System (Order Cancelled)',
                    changedAt: new Date(),
                });
            }
            await product.save();
            this.logger.log(`[Orders] Restored ${quantity} stock for product ${product.productId}. ` +
                `Stock: ${previousStock} -> ${newStock}`);
        }
    }
    async deductStockForOrder(order) {
        if (!order?.items?.length) {
            return;
        }
        for (const item of order.items) {
            if (!item.productId) {
                continue;
            }
            const quantity = Math.max(Number(item.quantity || 0), 0);
            if (quantity === 0) {
                continue;
            }
            const product = mongoose_2.Types.ObjectId.isValid(item.productId)
                ? await this.productModel.findById(item.productId)
                : await this.productModel.findOne({
                    productId: item.productId,
                });
            if (!product) {
                continue;
            }
            const previousStock = Number(product.stock || 0);
            const newStock = Math.max(previousStock - quantity, 0);
            product.stock = newStock;
            product.status = this.getStatusFromStock(newStock);
            product.updatedAt = new Date();
            if (Array.isArray(product.stockHistory)) {
                product.stockHistory.push({
                    previousStock,
                    newStock,
                    changedBy: 'System (Order Re-opened)',
                    changedAt: new Date(),
                });
            }
            await product.save();
        }
    }
    async attachItemSkus(orders) {
        const idSet = new Set();
        const codeSet = new Set();
        for (const order of orders) {
            for (const item of order.items || []) {
                if (!item?.productId)
                    continue;
                if (mongoose_2.Types.ObjectId.isValid(item.productId)) {
                    idSet.add(item.productId);
                }
                else {
                    codeSet.add(item.productId);
                }
            }
        }
        if (idSet.size === 0 && codeSet.size === 0) {
            return orders.map((order) => ({
                ...order,
                items: (order.items || []).map((item) => ({
                    ...item,
                    sku: null,
                })),
            }));
        }
        const productsById = idSet.size
            ? await this.productModel
                .find({
                _id: {
                    $in: Array.from(idSet),
                },
            })
                .select('productId')
                .exec()
            : [];
        const productsByCode = codeSet.size
            ? await this.productModel
                .find({
                productId: {
                    $in: Array.from(codeSet),
                },
            })
                .select('productId')
                .exec()
            : [];
        const skuById = new Map();
        for (const product of productsById) {
            skuById.set(String(product._id), product.productId);
        }
        const skuByCode = new Map();
        for (const product of productsByCode) {
            skuByCode.set(product.productId, product.productId);
        }
        return orders.map((order) => ({
            ...order,
            items: (order.items || []).map((item) => {
                const sku = item.productId
                    ? skuById.get(item.productId) ??
                        skuByCode.get(item.productId)
                    : undefined;
                return {
                    ...item,
                    sku: sku ?? null,
                };
            }),
        }));
    }
    validateWebsitePayment(dto) {
        if (dto.orderSource === 'direct') {
            return;
        }
        const method = String(dto.paymentMethod ?? '').toLowerCase();
        if (method === 'cod') {
            if (!dto.shippingAddress?.toLowerCase().includes('jaffna')) {
                throw new common_1.BadRequestException('Cash on Delivery is available only for Jaffna addresses.');
            }
        }
        else if (method === 'bank_transfer') {
            if (!dto.paymentSlipUrl?.trim()) {
                throw new common_1.BadRequestException('Please upload your bank transfer receipt.');
            }
        }
        else if (method === 'card') {
            throw new common_1.BadRequestException('Card payment is currently unavailable.');
        }
        else {
            throw new common_1.BadRequestException('Please choose a valid payment method.');
        }
    }
    async create(dto) {
        this.validateWebsitePayment(dto);
        if (dto.items?.length) {
            for (const item of dto.items) {
                if (!item.productId) {
                    continue;
                }
                const product = mongoose_2.Types.ObjectId.isValid(item.productId)
                    ? await this.productModel.findById(item.productId)
                    : await this.productModel.findOne({
                        productId: item.productId,
                    });
                if (!product) {
                    throw new common_1.NotFoundException('Product not found');
                }
                if (dto.orderSource !== 'direct' &&
                    product.isActive === false) {
                    throw new common_1.BadRequestException(`${product.productName} is currently unavailable`);
                }
                const quantity = this.getStockQuantity(product.productName, Number(item.quantity || 0));
                if (quantity === 0) {
                    continue;
                }
                if (Number(product.stock || 0) < quantity) {
                    throw new common_1.BadRequestException(`${product.productName} stock not available`);
                }
                product.stock =
                    Number(product.stock || 0) - quantity;
                product.status = this.getStatusFromStock(product.stock);
                product.updatedAt = new Date();
                await product.save();
            }
        }
        const resolvedCustomerId = await this.resolveOrderCustomerId({
            email: dto.email,
            customerId: dto.customerId,
        });
        const subtotal = (dto.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
        const deliveryFee = dto.orderSource === 'direct' && typeof dto.deliveryFee === 'number'
            ? dto.deliveryFee
            : 300;
        const order = await this.orderModel.create({
            ...dto,
            totalValue: subtotal + deliveryFee,
            deliveryFee,
            customerId: resolvedCustomerId,
        });
        await this.syncOrderIncome(order.toObject());
        await this.usersService.updateFromOrder({
            email: dto.email ?? '',
            customerName: dto.customerName ?? '',
            phone: dto.phone,
            shippingAddress: dto.shippingAddress ?? '',
            manual: dto.orderSource === 'direct',
        });
        try {
            const result = await this.mailService.sendOrderPlacedAdminNotification({
                orderId: order.orderId,
                customerName: order.customerName,
                email: order.email,
                phone: order.phone,
                qty: order.qty,
                totalValue: order.totalValue,
                subtotal,
                deliveryFee,
                paymentMethod: order.paymentMethod,
                paymentSlipUrl: order.paymentSlipUrl,
                shippingAddress: order.shippingAddress,
                district: order.district,
                items: order.items,
            });
            if (!result.success) {
                this.logger.warn(`[Orders] Admin notification not sent for order ${order.orderId}: ${result.error}`);
            }
        }
        catch (err) {
            this.logger.error(`[Orders] Admin notification threw for order ${order.orderId}: ${err instanceof Error
                ? err.message
                : String(err)}`);
        }
        return order;
    }
    async findAll(status, search) {
        const filter = {};
        if (status && status !== 'ALL') {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                {
                    orderId: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    customerName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    district: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }
        const orders = await this.orderModel
            .find(filter)
            .sort({ createdAt: -1 })
            .exec();
        const ordersWithCustomerId = await Promise.all(orders.map(async (order) => {
            const plainOrder = order.toObject();
            const customerId = await this.resolveOrderCustomerId({
                email: plainOrder.email,
                customerId: plainOrder.customerId,
            });
            return {
                ...plainOrder,
                customerId,
            };
        }));
        return this.attachItemSkus(ordersWithCustomerId);
    }
    async findForUser(userId, orderId) {
        const user = await this.usersService.findById(userId);
        if (!user?.email) {
            return [];
        }
        const escapedEmail = user.email
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const filter = {
            email: { $regex: `^${escapedEmail}$`, $options: 'i' },
        };
        if (orderId) {
            filter.orderId = orderId;
        }
        const orders = await this.orderModel
            .find(filter)
            .sort({ createdAt: -1 })
            .exec();
        return this.attachItemSkus(orders.map((order) => order.toObject()));
    }
    async findByOrderId(orderId) {
        const order = await this.orderModel
            .findOne({ orderId })
            .exec();
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const plainOrder = order.toObject();
        const customerId = await this.resolveOrderCustomerId({
            email: plainOrder.email,
            customerId: plainOrder.customerId,
        });
        const enrichedOrders = await this.attachItemSkus([
            {
                ...plainOrder,
                customerId,
            },
        ]);
        return enrichedOrders[0];
    }
    async findOne(id) {
        let order = null;
        if (mongoose_2.Types.ObjectId.isValid(id)) {
            order = await this.orderModel
                .findById(id)
                .exec();
        }
        if (!order) {
            order = await this.orderModel
                .findOne({ orderId: id })
                .exec();
        }
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const plainOrder = order.toObject();
        const customerId = await this.resolveOrderCustomerId({
            email: plainOrder.email,
            customerId: plainOrder.customerId,
        });
        const [enriched] = await this.attachItemSkus([
            {
                ...plainOrder,
                customerId,
            },
        ]);
        return enriched;
    }
    normalizeOrderStatus(status) {
        const normalized = String(status ?? '')
            .trim()
            .toUpperCase();
        if (normalized === 'CANCELLED') {
            return 'CANCELED';
        }
        return normalized;
    }
    async updateStatus(id, dto) {
        let order = null;
        if (mongoose_2.Types.ObjectId.isValid(id)) {
            order = await this.orderModel
                .findById(id)
                .exec();
        }
        if (!order) {
            order = await this.orderModel
                .findOne({ orderId: id })
                .exec();
        }
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const previousStatus = this.normalizeOrderStatus(order.status);
        const nextStatus = this.normalizeOrderStatus(dto.status);
        if (previousStatus !== 'CANCELED' &&
            nextStatus === 'CANCELED') {
            await this.restoreStockForOrder(order.toObject());
        }
        if (previousStatus === 'CANCELED' &&
            nextStatus !== 'CANCELED') {
            await this.deductStockForOrder(order.toObject());
        }
        order.status = nextStatus;
        if (nextStatus === 'DELIVERED' && previousStatus !== 'DELIVERED') {
            order.deliveredAt = new Date();
        }
        if (dto.adminNote !== undefined)
            order.adminNote = dto.adminNote;
        if (dto.paymentStatus)
            order.paymentStatus = dto.paymentStatus;
        if (dto.customerName !== undefined)
            order.customerName = dto.customerName;
        if (dto.email !== undefined)
            order.email = dto.email;
        if (dto.phone !== undefined)
            order.phone = dto.phone;
        if (dto.shippingAddress !== undefined)
            order.shippingAddress = dto.shippingAddress;
        await order.save();
        await this.syncOrderIncome(order.toObject());
        const plainOrder = order.toObject();
        if (!dto.sendEmailNotification) {
            const [enriched] = await this.attachItemSkus([
                plainOrder,
            ]);
            return enriched;
        }
        if (!order.email) {
            this.logger.warn(`[Orders] sendEmailNotification=true but order ${order.orderId} has no email address`);
            const [enriched] = await this.attachItemSkus([
                {
                    ...plainOrder,
                    emailNotification: {
                        attempted: false,
                        success: false,
                        error: 'Order has no email address',
                    },
                },
            ]);
            return enriched;
        }
        const emailResult = await this.mailService.sendOrderStatusUpdate({
            to: order.email,
            customerName: order.customerName,
            orderId: order.orderId,
            newStatus: nextStatus,
            adminNote: dto.adminNote,
        });
        const [enriched] = await this.attachItemSkus([
            {
                ...plainOrder,
                emailNotification: {
                    attempted: true,
                    success: emailResult.success,
                    ...(emailResult.error
                        ? {
                            error: emailResult.error,
                        }
                        : {}),
                },
            },
        ]);
        return enriched;
    }
    async delete(id) {
        let order = null;
        if (mongoose_2.Types.ObjectId.isValid(id)) {
            order = await this.orderModel
                .findById(id)
                .exec();
        }
        if (!order) {
            order = await this.orderModel
                .findOne({ orderId: id })
                .exec();
        }
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        await this.orderModel
            .deleteOne({ _id: order._id })
            .exec();
        await this.transactionModel
            .deleteOne({ id: this.incomeTxId(order.orderId) })
            .exec();
        return {
            message: 'Order deleted successfully',
        };
    }
    async generateReceipt(orderNumber) {
        const order = await this.orderModel.findOne({
            orderId: orderNumber,
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const orderObj = order.toObject();
        const getLineTotal = (price, quantity, name) => {
            const normalized = String(name ?? '')
                .trim()
                .toLowerCase();
            const isFourMagnetsPack = normalized === '4 magnets' ||
                normalized.startsWith('4 magnets ');
            const packSize = isFourMagnetsPack ? 4 : 1;
            return price * (quantity / packSize);
        };
        let itemsSubtotal = 0;
        if (orderObj.items &&
            orderObj.items.length > 0) {
            itemsSubtotal = orderObj.items.reduce((sum, item) => {
                const itemPrice = Number(item.price || 0);
                const itemQuantity = Number(item.quantity || 1);
                return (sum +
                    getLineTotal(itemPrice, itemQuantity, item.name));
            }, 0);
        }
        const SHIPPING_FEE = 200;
        const subtotal = Math.max(0, itemsSubtotal);
        const deliveryFee = typeof orderObj.deliveryFee === 'number'
            ? orderObj.deliveryFee
            : orderObj.paymentMethod === 'cod' &&
                orderObj.shippingAddress?.toLowerCase().includes('jaffna')
                ? 300
                : 0;
        const finalTotal = subtotal + deliveryFee;
        const itemsWithBase64Images = orderObj.items &&
            orderObj.items.length > 0
            ? await Promise.all(orderObj.items.map(async (item) => {
                if (item.primaryImage &&
                    typeof item.primaryImage ===
                        'string' &&
                    item.primaryImage.startsWith('http')) {
                    try {
                        const base64Image = await this.imageUrlToBase64(item.primaryImage);
                        return {
                            ...item,
                            image: base64Image,
                        };
                    }
                    catch (err) {
                        this.logger.warn(`[Orders] Failed to convert item image to base64 for order ${orderNumber}: ${err}`);
                        return {
                            ...item,
                            image: undefined,
                        };
                    }
                }
                return item;
            }))
            : orderObj.items;
        const receiptData = {
            orderId: orderObj.orderId,
            customerName: orderObj.customerName,
            email: orderObj.email,
            phone: orderObj.phone,
            shippingAddress: orderObj.shippingAddress,
            district: orderObj.district,
            status: orderObj.status,
            totalValue: finalTotal,
            subtotal,
            deliveryFee,
            qty: orderObj.qty,
            items: itemsWithBase64Images,
            createdAt: orderObj.createdAt ||
                new Date(),
            adminNote: orderObj.adminNote,
            paymentMethod: orderObj.paymentMethod,
            paymentStatus: orderObj.paymentStatus,
        };
        try {
            const pdfBuffer = await this.pdfGeneratorService.generateReceipt(receiptData);
            this.logger.log(`PDF receipt generated successfully for order: ${orderNumber}`);
            return pdfBuffer;
        }
        catch (error) {
            this.logger.error(`PDF generation failed for order ${orderNumber}:`, error);
            throw new Error('Unable to generate receipt PDF. Please contact support.');
        }
    }
    async imageUrlToBase64(url) {
        const jpegUrl = url.includes('cloudinary.com')
            ? url.replace('/upload/', '/upload/f_jpg/')
            : url;
        const response = await axios_1.default.get(jpegUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
        });
        return `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(2, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService,
        mail_service_1.MailService,
        pdf_generator_service_1.PdfGeneratorService,
        cloudflareR2_service_1.CloudflareR2Service])
], OrdersService);
//# sourceMappingURL=orders.service.js.map