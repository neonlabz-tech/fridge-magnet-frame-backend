import { Model } from 'mongoose';
import { Lead, LeadDocument, LeadTarget, LeadTargetDocument } from './schemas/lead.schema';
import { AddFollowUpDto, ConvertLeadDto, CreateLeadDto, ImportLeadsDto, ReassignLeadsDto, UpdateLeadDto, UpsertTargetDto } from './dto/lead.dto';
export interface LeadQuery {
    owner?: string;
    status?: string;
    source?: string;
    search?: string;
}
export declare class LeadsService {
    private readonly model;
    private readonly targetModel;
    constructor(model: Model<LeadDocument>, targetModel: Model<LeadTargetDocument>);
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
}
