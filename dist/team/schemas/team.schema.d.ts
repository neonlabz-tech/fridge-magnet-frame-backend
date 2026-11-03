import { Document } from 'mongoose';
export type TeamMemberDocument = TeamMember & Document;
export type TeamRoleDocument = TeamRole & Document;
export declare const DEFAULT_ROLE_NAME = "Business Operator";
export declare const TEAM_NAME = "Business Operator";
export declare const PAGE_HREFS: readonly ["/dashboard/orders", "/dashboard/customers", "/dashboard/products", "/dashboard/inventory", "/dashboard/deliveries", "/dashboard/leads", "/dashboard/targets", "/dashboard/finance"];
export declare class TeamMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    joinDate: string;
    role: string;
    status: string;
    username: string;
    passwordHash: string;
    passwordChangedAt?: Date;
    mustChangePassword: boolean;
    tokenVersion: number;
}
export declare const TeamMemberSchema: import("mongoose").Schema<TeamMember, import("mongoose").Model<TeamMember, any, any, any, any, any, TeamMember>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, {
    id?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    joinDate?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    role?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    username?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    passwordHash?: import("mongoose").SchemaDefinitionProperty<string, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    passwordChangedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    mustChangePassword?: import("mongoose").SchemaDefinitionProperty<boolean, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    tokenVersion?: import("mongoose").SchemaDefinitionProperty<number, TeamMember, Document<unknown, {}, TeamMember, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
}, TeamMember>;
export declare const PERMISSION_KEYS: readonly ["/dashboard/orders", "/dashboard/customers", "/dashboard/products", "/dashboard/inventory", "/dashboard/deliveries", "/dashboard/leads", "/dashboard/targets", "/dashboard/finance#income", "/dashboard/finance#expense"];
export declare const PERMISSION_ACTIONS: readonly ["view", "create", "edit", "delete"];
export declare const WIDGET_KEYS: readonly ["stats", "stat-orders", "stat-revenue", "stat-customers", "stat-stock", "stat-deliveries", "stat-profit", "revenue-trend", "orders-per-day", "income-expenses", "top-products", "order-status", "payment-methods", "product-stock", "delivery-status", "leads", "hide-product-cost", "hide-product-profit"];
export declare class TeamRole {
    id: string;
    name: string;
    pages: string[];
    permissions: Record<string, string[]>;
    widgets?: string[];
}
export declare const TeamRoleSchema: import("mongoose").Schema<TeamRole, import("mongoose").Model<TeamRole, any, any, any, any, any, TeamRole>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TeamRole, Document<unknown, {}, TeamRole, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, {
    id?: import("mongoose").SchemaDefinitionProperty<string, TeamRole, Document<unknown, {}, TeamRole, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, TeamRole, Document<unknown, {}, TeamRole, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    pages?: import("mongoose").SchemaDefinitionProperty<string[], TeamRole, Document<unknown, {}, TeamRole, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    permissions?: import("mongoose").SchemaDefinitionProperty<Record<string, string[]>, TeamRole, Document<unknown, {}, TeamRole, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    widgets?: import("mongoose").SchemaDefinitionProperty<string[] | undefined, TeamRole, Document<unknown, {}, TeamRole, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
}, TeamRole>;
