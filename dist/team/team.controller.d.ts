import { TeamService } from './team.service';
import { CreateMemberDto, CreateRoleDto, MemberLoginDto, ResetPasswordDto, UpdateMemberDto, UpdateRoleDto } from './dto/team.dto';
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
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
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamRoleDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamRole & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateRole(id: string, dto: UpdateRoleDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamRoleDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamRole & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    replaceRole(id: string, dto: UpdateRoleDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamRoleDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamRole & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    removeRole(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamRoleDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamRole & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    findMembers(status?: string, search?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    findMember(id: string): Promise<{
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    createMember(dto: CreateMemberDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    setStatus(id: string, status: 'Active' | 'Inactive'): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateMember(id: string, dto: UpdateMemberDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    replaceMember(id: string, dto: UpdateMemberDto): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    removeMember(id: string): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/team.schema").TeamMemberDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/team.schema").TeamMember & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
