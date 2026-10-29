import { Document } from 'mongoose';
export type TransactionDocument = Transaction & Document;
export declare const TX_KINDS: readonly ["income", "expense"];
export declare const TX_METHODS: readonly ["Bank Transfer", "Cash", "Card Payment"];
export declare const TX_STATUSES: readonly ["completed", "pending"];
export declare class Transaction {
    id: string;
    kind: string;
    date: string;
    ref: string;
    party: string;
    note: string;
    amount: number;
    method: string;
    status: string;
    createdBy?: string;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, any, any, Transaction>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, {
    id?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    kind?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    date?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    ref?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    party?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    note?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    method?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
    createdBy?: import("mongoose").SchemaDefinitionProperty<string | undefined, Transaction, Document<unknown, {}, Transaction, {}, import("mongoose").DefaultSchemaOptions> & Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> | undefined;
}, Transaction>;
