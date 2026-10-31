"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcrypt"));
const team_schema_1 = require("./schemas/team.schema");
const clean_json_1 = require("../common/utils/clean-json");
const RESERVED_USERNAMES = ['admin'];
const rolePrefix = (role) => {
    const words = role.trim().split(/\s+/).filter(Boolean);
    const raw = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 3) : (words[0] ?? 'US').slice(0, 2);
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'US';
};
let TeamService = class TeamService {
    constructor(memberModel, roleModel, jwtService) {
        this.memberModel = memberModel;
        this.roleModel = roleModel;
        this.jwtService = jwtService;
    }
    async ensureDefaultRole() {
        if (await this.roleModel.exists({ name: team_schema_1.DEFAULT_ROLE_NAME }))
            return;
        const ids = (await this.roleModel.find({}, 'id').exec()).map((r) => r.id);
        await this.roleModel.create({
            id: (0, clean_json_1.nextSequenceId)(ids, 'ROLE-', 3),
            name: team_schema_1.DEFAULT_ROLE_NAME,
            pages: [...team_schema_1.PAGE_HREFS],
        });
    }
    async findRoles() {
        await this.ensureDefaultRole();
        const [roles, members] = await Promise.all([
            this.roleModel.find().sort({ createdAt: 1 }).exec(),
            this.memberModel.find({}, 'role').exec(),
        ]);
        const counts = members.reduce((acc, m) => ({ ...acc, [m.role]: (acc[m.role] ?? 0) + 1 }), {});
        const data = roles.map((r) => ({ ...r.toJSON(), memberCount: counts[r.name] ?? 0 }));
        return { data, total: data.length };
    }
    async createRole(dto) {
        await this.ensureDefaultRole();
        const name = dto.name.trim();
        if (await this.roleModel.exists({ name })) {
            throw new common_1.ConflictException('A role with this name already exists');
        }
        const ids = (await this.roleModel.find({}, 'id').exec()).map((r) => r.id);
        const role = await this.roleModel.create({
            id: (0, clean_json_1.nextSequenceId)(ids, 'ROLE-', 3),
            name,
            pages: dto.pages ?? [],
        });
        return { message: 'Role created successfully', data: role };
    }
    async updateRole(id, dto) {
        const role = await this.roleModel.findOne({ id }).exec();
        if (!role)
            throw new common_1.NotFoundException(`Role ${id} not found`);
        const previousName = role.name;
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (name !== previousName && (await this.roleModel.exists({ name }))) {
                throw new common_1.ConflictException('A role with this name already exists');
            }
            role.name = name;
        }
        if (dto.pages !== undefined)
            role.pages = dto.pages;
        await role.save();
        if (role.name !== previousName) {
            await this.memberModel.updateMany({ role: previousName }, { $set: { role: role.name } }).exec();
        }
        return { message: 'Role updated successfully', data: role };
    }
    async removeRole(id) {
        const role = await this.roleModel.findOne({ id }).exec();
        if (!role)
            throw new common_1.NotFoundException(`Role ${id} not found`);
        const inUse = await this.memberModel.countDocuments({ role: role.name }).exec();
        if (inUse > 0) {
            throw new common_1.BadRequestException(`Role is assigned to ${inUse} user(s); reassign them first`);
        }
        await role.deleteOne();
        return { message: 'Role deleted successfully', data: role };
    }
    async findMembers(status, search) {
        const filter = {};
        if (status === 'Active' || status === 'Inactive')
            filter.status = status;
        if (search?.trim()) {
            const rx = new RegExp((0, clean_json_1.escapeRegex)(search.trim()), 'i');
            filter.$or = [{ id: rx }, { name: rx }, { email: rx }, { phone: rx }, { username: rx }];
        }
        const [data, all] = await Promise.all([
            this.memberModel.find(filter).sort({ createdAt: -1 }).exec(),
            this.memberModel.find({}, 'status').exec(),
        ]);
        const active = all.filter((m) => m.status === 'Active').length;
        return {
            data,
            total: data.length,
            summary: { users: all.length, active, inactive: all.length - active },
            team: { id: 'TEAM-002', name: team_schema_1.TEAM_NAME },
        };
    }
    async findMember(id) {
        const member = await this.memberModel.findOne({ id }).exec();
        if (!member)
            throw new common_1.NotFoundException(`User ${id} not found`);
        return member;
    }
    async assertUnique(username, email, exceptId) {
        if (RESERVED_USERNAMES.includes(username)) {
            throw new common_1.ConflictException('This username is already taken');
        }
        const clash = await this.memberModel
            .findOne({ $or: [{ username }, { email }], ...(exceptId ? { id: { $ne: exceptId } } : {}) })
            .exec();
        if (clash) {
            throw new common_1.ConflictException(clash.username === username ? 'This username is already taken' : 'This email is already used');
        }
    }
    async assertRoleExists(name) {
        await this.ensureDefaultRole();
        if (!(await this.roleModel.exists({ name }))) {
            throw new common_1.BadRequestException(`Role "${name}" does not exist`);
        }
    }
    async createMember(dto) {
        const email = dto.email.toLowerCase();
        const role = dto.role ?? team_schema_1.DEFAULT_ROLE_NAME;
        await this.assertRoleExists(role);
        const prefix = rolePrefix(role);
        const sameRole = (await this.memberModel.find({ id: new RegExp(`^${prefix}\\d{3,}$`) }, 'id').exec())
            .map((m) => m.id);
        const id = (0, clean_json_1.nextSequenceId)(sameRole, prefix, 3);
        const username = (dto.username ?? id).toLowerCase();
        await this.assertUnique(username, email);
        const member = await this.memberModel.create({
            id,
            name: dto.name.trim(),
            email,
            phone: dto.phone.trim(),
            joinDate: new Date().toISOString().slice(0, 10),
            role,
            status: 'Active',
            username,
            passwordHash: await bcrypt.hash(dto.password, 10),
        });
        return { message: 'User created successfully', data: member };
    }
    async updateMember(id, dto) {
        const member = await this.findMember(id);
        const username = dto.username?.toLowerCase() ?? member.username;
        const email = dto.email?.toLowerCase() ?? member.email;
        if (dto.role !== undefined)
            await this.assertRoleExists(dto.role);
        if (username !== member.username || email !== member.email) {
            await this.assertUnique(username, email, id);
        }
        if (dto.name !== undefined)
            member.name = dto.name.trim();
        if (dto.phone !== undefined)
            member.phone = dto.phone.trim();
        if (dto.role !== undefined)
            member.role = dto.role;
        if (dto.status !== undefined)
            member.status = dto.status;
        member.username = username;
        member.email = email;
        if (dto.password)
            member.passwordHash = await bcrypt.hash(dto.password, 10);
        await member.save();
        return { message: 'User updated successfully', data: member };
    }
    async setMemberStatus(id, status) {
        return this.updateMember(id, { status });
    }
    async resetPassword(id, password) {
        const member = await this.findMember(id);
        member.passwordHash = await bcrypt.hash(password, 10);
        await member.save();
        return { message: 'Password reset successfully', data: member };
    }
    async removeMember(id) {
        const member = await this.memberModel.findOneAndDelete({ id }).exec();
        if (!member)
            throw new common_1.NotFoundException(`User ${id} not found`);
        return { message: 'User deleted successfully', data: member };
    }
    async allowedPages(roleName) {
        await this.ensureDefaultRole();
        const role = (await this.roleModel.findOne({ name: roleName }).exec()) ??
            (await this.roleModel.findOne({ name: team_schema_1.DEFAULT_ROLE_NAME }).exec());
        return ['/dashboard', ...(role?.pages ?? []).filter((p) => team_schema_1.PAGE_HREFS.includes(p))];
    }
    async login(dto) {
        const member = await this.memberModel
            .findOne({ username: dto.username.trim().toLowerCase() })
            .exec();
        const valid = member && (await bcrypt.compare(dto.password, member.passwordHash));
        if (!member || !valid || member.status !== 'Active') {
            throw new common_1.UnauthorizedException('Username or password is incorrect, or this account is inactive.');
        }
        const token = this.jwtService.sign({
            sub: member._id.toString(),
            email: member.email,
            username: member.username,
            role: 'member',
        });
        return {
            token,
            access_token: token,
            session: {
                username: member.username,
                name: member.name,
                role: 'member',
                teamName: member.role || team_schema_1.TEAM_NAME,
            },
            allowedPages: await this.allowedPages(member.role),
        };
    }
};
exports.TeamService = TeamService;
exports.TeamService = TeamService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(team_schema_1.TeamMember.name)),
    __param(1, (0, mongoose_1.InjectModel)(team_schema_1.TeamRole.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService])
], TeamService);
//# sourceMappingURL=team.service.js.map