import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
export interface TransactionQuery {
    kind?: string;
    status?: string;
    search?: string;
    createdBy?: string;
    from?: string;
    to?: string;
}
export declare class FinanceService {
    private readonly model;
    constructor(model: Model<TransactionDocument>);
    private buildFilter;
    findAll(q: TransactionQuery): Promise<{
        data: (import("mongoose").Document<unknown, {}, TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        summary: {
            totalIncome: number;
            totalExpense: number;
            netProfit: number;
        };
    }>;
    summary(q: TransactionQuery): Promise<{
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
    }>;
    private summarise;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    create(dto: CreateTransactionDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    update(id: string, dto: UpdateTransactionDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    remove(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
