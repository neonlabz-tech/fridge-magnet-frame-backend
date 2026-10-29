import { Model } from 'mongoose';
import { Delivery, DeliveryDocument } from './schemas/delivery.schema';
import { OrderDocument } from '../orders/schemas/order.schema';
import { BulkDeliveryStatusDto, CreateDeliveryDto, UpdateDeliveryDto } from './dto/delivery.dto';
export declare const DRIVERS: string[];
export declare const TIME_SLOTS: string[];
export interface DeliveryQuery {
    status?: string;
    method?: string;
    driver?: string;
    search?: string;
}
export declare class DeliveriesService {
    private readonly model;
    private readonly orderModel;
    constructor(model: Model<DeliveryDocument>, orderModel: Model<OrderDocument>);
    options(): {
        drivers: string[];
        timeSlots: string[];
    };
    private nextId;
    findAll(q: DeliveryQuery): Promise<{
        data: (import("mongoose").Document<unknown, {}, DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
    }>;
    dispatchOrders(): Promise<{
        data: {
            orderId: string;
            badge: string;
            total: number;
            customer: string;
            phone: string;
            place: string;
            address: string;
        }[];
        total: number;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    create(dto: CreateDeliveryDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    update(id: string, dto: UpdateDeliveryDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateStatus(id: string, status: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    bulkUpdateStatus(dto: BulkDeliveryStatusDto): Promise<{
        message: string;
        matched: number;
        modified: number;
    }>;
    remove(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
