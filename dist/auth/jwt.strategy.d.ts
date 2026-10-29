import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { Admin } from '../schemas/admin.schema';
import { TeamMemberDocument } from '../team/schemas/team.schema';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    private configService;
    private adminModel;
    private teamMemberModel;
    constructor(usersService: UsersService, configService: ConfigService, adminModel: Model<Admin>, teamMemberModel: Model<TeamMemberDocument>);
    validate(payload: any): Promise<{
        userId: string;
        email: string;
        role: string;
        username?: undefined;
    } | {
        userId: string;
        email: string;
        username: string;
        role: string;
    }>;
}
export {};
