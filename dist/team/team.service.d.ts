import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { TeamMember, TeamMemberDocument, TeamRole, TeamRoleDocument } from './schemas/team.schema';
import { CreateMemberDto, CreateRoleDto, MemberLoginDto, UpdateMemberDto, UpdateRoleDto } from './dto/team.dto';
export declare class TeamService {
    private readonly memberModel;
    private readonly roleModel;
    private readonly jwtService;
    constructor(memberModel: Model<TeamMemberDocument>, roleModel: Model<TeamRoleDocument>, jwtService: JwtService);
    private ensureDefaultRole;
    findRoles(): Promise<{
        data: {
            memberCount: number;
            id: string;
            name: string;
            pages: string[];
            _id: import("mongoose").Types.ObjectId;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: import("mongoose").Collection;
            db: import("mongoose").Connection;
            errors?: import("mongoose").Error.ValidationError;
            isNew: boolean;
            schema: import("mongoose").Schema;
            __v: number;
        }[];
        total: number;
    }>;
    createRole(dto: CreateRoleDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TeamRoleDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateRole(id: string, dto: UpdateRoleDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TeamRoleDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    removeRole(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TeamRoleDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamRole & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    findMembers(status?: string, search?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        summary: {
            users: number;
            active: number;
            inactive: number;
        };
        team: {
            id: string;
            name: string;
        };
    }>;
    findMember(id: string): Promise<import("mongoose").Document<unknown, {}, TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    private assertUnique;
    private assertRoleExists;
    createMember(dto: CreateMemberDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateMember(id: string, dto: UpdateMemberDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    setMemberStatus(id: string, status: 'Active' | 'Inactive'): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    resetPassword(id: string, password: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    removeMember(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    allowedPages(roleName: string): Promise<string[]>;
    login(dto: MemberLoginDto): Promise<{
        token: string;
        access_token: string;
        session: {
            username: string;
            name: string;
            role: string;
            teamName: string;
        };
        allowedPages: string[];
    }>;
}
