import { DeliveriesService } from './deliveries.service';
import { BulkDeliveryStatusDto, CreateDeliveryDto, UpdateDeliveryDto, UpdateDeliveryStatusDto } from './dto/delivery.dto';
export declare class DeliveriesController {
    private readonly deliveriesService;
    constructor(deliveriesService: DeliveriesService);
    findAll(status?: string, method?: string, driver?: string, search?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/delivery.schema").DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/delivery.schema").Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
    }>;
    options(): {
        drivers: string[];
        timeSlots: string[];
    };
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
    bulkStatus(dto: BulkDeliveryStatusDto): Promise<{
        message: string;
        matched: number;
        modified: number;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/delivery.schema").DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/delivery.schema").Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    create(dto: CreateDeliveryDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/delivery.schema").DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/delivery.schema").Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateStatus(id: string, dto: UpdateDeliveryStatusDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/delivery.schema").DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/delivery.schema").Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    update(id: string, dto: UpdateDeliveryDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/delivery.schema").DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/delivery.schema").Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    replace(id: string, dto: UpdateDeliveryDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/delivery.schema").DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/delivery.schema").Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    remove(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/delivery.schema").DeliveryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/delivery.schema").Delivery & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
