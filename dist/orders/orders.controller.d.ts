import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
import type { Response } from 'express';
export declare class OrdersController {
    private readonly ordersService;
    private readonly logger;
    constructor(ordersService: OrdersService);
    create(dto: CreateOrderDto): Promise<any>;
    syncIncome(): Promise<{
        created: number;
        skipped: number;
    }>;
    findAll(status?: string, search?: string): Promise<any>;
    downloadPhoto(url: string, name: string, res: Response): Promise<void>;
    findMine(req: {
        user: {
            userId: string;
        };
    }): Promise<Record<string, any>[]>;
    findMyOrder(req: {
        user: {
            userId: string;
        };
    }, orderId: string): Promise<Record<string, any>>;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<any>;
    deleteCustomerImages(id: string): Promise<any>;
    delete(id: string): Promise<any>;
    downloadReceipt(orderNumber: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getReceiptStatus(orderNumber: string): Promise<{
        success: boolean;
        message: string;
        orderId: any;
        customerName: any;
        status: any;
        downloadUrl: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        orderId?: undefined;
        customerName?: undefined;
        status?: undefined;
        downloadUrl?: undefined;
    }>;
}
