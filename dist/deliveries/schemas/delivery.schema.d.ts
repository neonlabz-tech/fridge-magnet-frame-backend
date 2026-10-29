import { Document } from 'mongoose';
export type DeliveryDocument = Delivery & Document;
export declare const DELIVERY_STATUSES: readonly ["pending", "in-transit", "delivered", "returned"];
export declare const DELIVERY_METHODS: readonly ["Standard", "Courier"];
export declare class Delivery {
    id: string;
    orderId: string;
    orderTotal: number;
    method: string;
    tracking: string;
    driver: string;
    place: string;
    recipient: string;
    phone: string;
    address: string;
    date: string;
    timeSlot: string;
    status: string;
    vehicleType: string;
    licenseNo: string;
    plateNo: string;
    emergencyContact: string;
    zones: string[];
}
export declare const DeliverySchema: import("mongoose").Schema<Delivery, import("mongoose").Model<Delivery, any, any, any, any, any, Delivery>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, {
    id?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    orderId?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    orderTotal?: import("mongoose").SchemaDefinitionProperty<number, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    method?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    tracking?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    driver?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    place?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    recipient?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    address?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    date?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    timeSlot?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    vehicleType?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    licenseNo?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    plateNo?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    emergencyContact?: import("mongoose").SchemaDefinitionProperty<string, Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    zones?: import("mongoose").SchemaDefinitionProperty<string[], Delivery, Document<unknown, {}, Delivery, {}, import("mongoose").DefaultSchemaOptions> & Delivery & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
}, Delivery>;
