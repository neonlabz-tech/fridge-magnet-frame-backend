export declare class CreateMemberDto {
    name: string;
    email: string;
    phone: string;
    role?: string;
    username?: string;
    password: string;
}
export declare class UpdateMemberDto {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    username?: string;
    password?: string;
    status?: string;
}
export declare class ResetPasswordDto {
    password: string;
}
export declare class MemberLoginDto {
    username: string;
    password: string;
}
export declare class CreateRoleDto {
    name: string;
    pages?: string[];
}
export declare class UpdateRoleDto {
    name?: string;
    pages?: string[];
}
