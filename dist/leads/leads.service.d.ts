import { Model } from 'mongoose';
import { CommissionTier, CommissionTierDocument, Lead, LeadDocument, LeadTarget, LeadTargetDocument } from './schemas/lead.schema';
import { AddFollowUpDto, ConvertLeadDto, CreateLeadDto, ImportLeadsDto, ReassignLeadsDto, UpdateLeadDto, UpsertCommissionTierDto, UpsertTargetDto } from './dto/lead.dto';
export interface LeadQuery {
    owner?: string;
    status?: string;
    source?: string;
    search?: string;
}
export declare class LeadsService {
    private readonly model;
    private readonly targetModel;
    private readonly tierModel;
    constructor(model: Model<LeadDocument>, targetModel: Model<LeadTargetDocument>, tierModel: Model<CommissionTierDocument>);
    private systemEntry;
    private nextFollowUpNumber;
    findAll(q: LeadQuery): Promise<{
        data: (import("mongoose").Document<unknown, {}, LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    private digits;
    private assertPhoneFree;
    create(dto: CreateLeadDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    importMany(dto: ImportLeadsDto): Promise<{
        message: string;
        created: number;
        skipped: number;
    }>;
    update(id: string, dto: UpdateLeadDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    addFollowUp(id: string, dto: AddFollowUpDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    convert(id: string, dto: ConvertLeadDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    reassign(dto: ReassignLeadsDto): Promise<{
        message: string;
        moved: number;
    }>;
    remove(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    findTargets(): Promise<{
        data: {
            [k: string]: LeadTarget & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            };
        };
    }>;
    upsertTarget(username: string, dto: UpsertTargetDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, LeadTargetDocument, {}, import("mongoose").DefaultSchemaOptions> & LeadTarget & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    findTiers(): Promise<{
        data: (import("mongoose").Document<unknown, {}, CommissionTierDocument, {}, import("mongoose").DefaultSchemaOptions> & CommissionTier & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    createTier(dto: UpsertCommissionTierDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, CommissionTierDocument, {}, import("mongoose").DefaultSchemaOptions> & CommissionTier & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateTier(id: string, dto: UpsertCommissionTierDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, CommissionTierDocument, {}, import("mongoose").DefaultSchemaOptions> & CommissionTier & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    removeTier(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, CommissionTierDocument, {}, import("mongoose").DefaultSchemaOptions> & CommissionTier & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
