import { Document } from 'mongoose';
export type TeamMemberDocument = TeamMember & Document;
export type TeamRoleDocument = TeamRole & Document;
export declare const DEFAULT_ROLE_NAME = "Business Operator";
export declare const TEAM_NAME = "Business Operator";
export declare const PAGE_HREFS: readonly ["/dashboard/orders", "/dashboard/customers", "/dashboard/products", "/dashboard/inventory", "/dashboard/deliveries", "/dashboard/leads", "/dashboard/finance"];
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
}, TeamMember>;
export declare class TeamRole {
    id: string;
    name: string;
    pages: string[];
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
}, TeamRole>;
