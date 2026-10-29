import { Document } from 'mongoose';
export type LeadDocument = Lead & Document;
export type LeadTargetDocument = LeadTarget & Document;
export declare const LEAD_STATUSES: readonly ["New", "Connected", "Follow Up", "Converted", "Lost"];
export interface FollowUp {
    n: number;
    at: string;
    by: string;
    callStatus: string;
    result: string;
    product: string;
    notes: string;
    nextFollowUp: string;
    system?: boolean;
    edits?: {
        at: string;
        by: string;
        before: string;
    }[];
}
export interface LeadOrderInfo {
    product: string;
    quantity: number;
    unitPrice: number;
    total: number;
    address: string;
    phone: string;
    convertedAt: string;
}
export declare class Lead {
    id: string;
    dateAdded: string;
    business: string;
    phone: string;
    source: string;
    callStatus: string;
    result: string;
    product: string;
    status: string;
    nextFollowUp: string;
    owner: string;
    email: string;
    address: string;
    notes: string;
    history: FollowUp[];
    customerId?: string;
    order?: LeadOrderInfo;
}
export declare const LeadSchema: import("mongoose").Schema<Lead, import("mongoose").Model<Lead, any, any, any, any, any, Lead>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, {
    id?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    dateAdded?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    business?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    source?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    callStatus?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    result?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    product?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    nextFollowUp?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    owner?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    address?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    notes?: import("mongoose").SchemaDefinitionProperty<string, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    history?: import("mongoose").SchemaDefinitionProperty<FollowUp[], Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    customerId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    order?: import("mongoose").SchemaDefinitionProperty<LeadOrderInfo | undefined, Lead, Document<unknown, {}, Lead, {}, import("mongoose").DefaultSchemaOptions> & Lead & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
}, Lead>;
export declare class LeadTarget {
    username: string;
    monthlyOrders: number;
    salesAmount: number;
    dailyCalls: number;
    dailyLeads: number;
}
export declare const LeadTargetSchema: import("mongoose").Schema<LeadTarget, import("mongoose").Model<LeadTarget, any, any, any, any, any, LeadTarget>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LeadTarget, Document<unknown, {}, LeadTarget, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<LeadTarget & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    username?: import("mongoose").SchemaDefinitionProperty<string, LeadTarget, Document<unknown, {}, LeadTarget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LeadTarget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    monthlyOrders?: import("mongoose").SchemaDefinitionProperty<number, LeadTarget, Document<unknown, {}, LeadTarget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LeadTarget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    salesAmount?: import("mongoose").SchemaDefinitionProperty<number, LeadTarget, Document<unknown, {}, LeadTarget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LeadTarget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    dailyCalls?: import("mongoose").SchemaDefinitionProperty<number, LeadTarget, Document<unknown, {}, LeadTarget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LeadTarget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    dailyLeads?: import("mongoose").SchemaDefinitionProperty<number, LeadTarget, Document<unknown, {}, LeadTarget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<LeadTarget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, LeadTarget>;
