import { FinanceService } from './finance.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    findAll(kind?: string, status?: string, search?: string, createdBy?: string, from?: string, to?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/transaction.schema").TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/transaction.schema").Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    summary(createdBy?: string, from?: string, to?: string): Promise<{
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/transaction.schema").TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/transaction.schema").Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    create(dto: CreateTransactionDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/transaction.schema").TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/transaction.schema").Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    update(id: string, dto: UpdateTransactionDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/transaction.schema").TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/transaction.schema").Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    replace(id: string, dto: UpdateTransactionDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/transaction.schema").TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/transaction.schema").Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    remove(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/transaction.schema").TransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/transaction.schema").Transaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
