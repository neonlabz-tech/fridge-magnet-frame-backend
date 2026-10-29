"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const mongoose_2 = require("mongoose");
const users_service_1 = require("../users/users.service");
const admin_schema_1 = require("../schemas/admin.schema");
const team_schema_1 = require("../team/schemas/team.schema");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(usersService, configService, adminModel, teamMemberModel) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
        });
        this.usersService = usersService;
        this.configService = configService;
        this.adminModel = adminModel;
        this.teamMemberModel = teamMemberModel;
    }
    async validate(payload) {
        if (payload.role === 'admin') {
            const admin = await this.adminModel.findById(payload.sub);
            if (!admin)
                throw new common_1.UnauthorizedException();
            return { userId: admin._id.toString(), email: admin.email, role: 'admin' };
        }
        if (payload.role === 'member') {
            const member = await this.teamMemberModel.findById(payload.sub);
            if (!member || member.status !== 'Active')
                throw new common_1.UnauthorizedException();
            return {
                userId: member._id.toString(),
                email: member.email,
                username: member.username,
                role: 'member',
            };
        }
        const user = await this.usersService.findByEmail(payload.email);
        if (!user)
            throw new common_1.UnauthorizedException();
        return { userId: user._id.toString(), email: user.email, role: user.role };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __param(3, (0, mongoose_1.InjectModel)(team_schema_1.TeamMember.name)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map