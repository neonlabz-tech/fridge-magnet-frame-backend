import { LeadsService } from './leads.service';
import { AddFollowUpDto, ConvertLeadDto, CreateLeadDto, ImportLeadsDto, ReassignLeadsDto, UpdateLeadDto, UpsertTargetDto } from './dto/lead.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    findAll(owner?: string, status?: string, source?: string, search?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
    }>;
    findTargets(): Promise<{
        data: {
            [k: string]: import("./schemas/lead.schema").LeadTarget & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            };
        };
    }>;
    upsertTarget(username: string, dto: UpsertTargetDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadTargetDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").LeadTarget & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    importMany(dto: ImportLeadsDto): Promise<{
        message: string;
        created: number;
        skipped: number;
    }>;
    reassign(dto: ReassignLeadsDto): Promise<{
        message: string;
        moved: number;
    }>;
    findOne(id: string): Promise<{
        data: import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    create(dto: CreateLeadDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    addFollowUp(id: string, dto: AddFollowUpDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    convert(id: string, dto: ConvertLeadDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    update(id: string, dto: UpdateLeadDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    replace(id: string, dto: UpdateLeadDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    remove(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/lead.schema").LeadDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/lead.schema").Lead & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
