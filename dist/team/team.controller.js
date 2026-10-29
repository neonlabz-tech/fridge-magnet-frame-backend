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
exports.TeamController = void 0;
const common_1 = require("@nestjs/common");
const team_service_1 = require("./team.service");
const team_dto_1 = require("./dto/team.dto");
let TeamController = class TeamController {
    constructor(teamService) {
        this.teamService = teamService;
    }
    login(dto) {
        return this.teamService.login(dto);
    }
    findRoles() {
        return this.teamService.findRoles();
    }
    createRole(dto) {
        return this.teamService.createRole(dto);
    }
    updateRole(id, dto) {
        return this.teamService.updateRole(id, dto);
    }
    replaceRole(id, dto) {
        return this.teamService.updateRole(id, dto);
    }
    removeRole(id) {
        return this.teamService.removeRole(id);
    }
    findMembers(status, search) {
        return this.teamService.findMembers(status, search);
    }
    async findMember(id) {
        return { data: await this.teamService.findMember(id) };
    }
    createMember(dto) {
        return this.teamService.createMember(dto);
    }
    setStatus(id, status) {
        return this.teamService.setMemberStatus(id, status);
    }
    resetPassword(id, dto) {
        return this.teamService.resetPassword(id, dto.password);
    }
    updateMember(id, dto) {
        return this.teamService.updateMember(id, dto);
    }
    replaceMember(id, dto) {
        return this.teamService.updateMember(id, dto);
    }
    removeMember(id) {
        return this.teamService.removeMember(id);
    }
};
exports.TeamController = TeamController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [team_dto_1.MemberLoginDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "findRoles", null);
__decorate([
    (0, common_1.Post)('roles'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [team_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "createRole", null);
__decorate([
    (0, common_1.Patch)('roles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, team_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Put)('roles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, team_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "replaceRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "removeRole", null);
__decorate([
    (0, common_1.Get)('members'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "findMembers", null);
__decorate([
    (0, common_1.Get)('members/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findMember", null);
__decorate([
    (0, common_1.Post)('members'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [team_dto_1.CreateMemberDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "createMember", null);
__decorate([
    (0, common_1.Patch)('members/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "setStatus", null);
__decorate([
    (0, common_1.Post)('members/:id/reset-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, team_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Patch)('members/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, team_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Put)('members/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, team_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "replaceMember", null);
__decorate([
    (0, common_1.Delete)('members/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "removeMember", null);
exports.TeamController = TeamController = __decorate([
    (0, common_1.Controller)('team'),
    __metadata("design:paramtypes", [team_service_1.TeamService])
], TeamController);
//# sourceMappingURL=team.controller.js.map