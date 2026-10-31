import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_ROLE_NAME,
  PAGE_HREFS,
  TEAM_NAME,
  TeamMember,
  TeamMemberDocument,
  TeamRole,
  TeamRoleDocument,
} from './schemas/team.schema';
import {
  CreateMemberDto,
  CreateRoleDto,
  MemberLoginDto,
  UpdateMemberDto,
  UpdateRoleDto,
} from './dto/team.dto';
import { escapeRegex, nextSequenceId } from '../common/utils/clean-json';

const RESERVED_USERNAMES = ['admin'];

/** "Business Operator" -> BO, "Sales Executive" -> SE, "Sales" -> SA */
const rolePrefix = (role: string) => {
  const words = role.trim().split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 3) : (words[0] ?? 'US').slice(0, 2);
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'US';
};

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(TeamMember.name)
    private readonly memberModel: Model<TeamMemberDocument>,
    @InjectModel(TeamRole.name)
    private readonly roleModel: Model<TeamRoleDocument>,
    private readonly jwtService: JwtService,
  ) {}

  /* ---------- roles ---------- */

  private async ensureDefaultRole() {
    if (await this.roleModel.exists({ name: DEFAULT_ROLE_NAME })) return;
    const ids = (await this.roleModel.find({}, 'id').exec()).map((r) => r.id);
    await this.roleModel.create({
      id: nextSequenceId(ids, 'ROLE-', 3),
      name: DEFAULT_ROLE_NAME,
      pages: [...PAGE_HREFS],
    });
  }

  async findRoles() {
    await this.ensureDefaultRole();
    const [roles, members] = await Promise.all([
      this.roleModel.find().sort({ createdAt: 1 }).exec(),
      this.memberModel.find({}, 'role').exec(),
    ]);
    const counts = members.reduce<Record<string, number>>(
      (acc, m) => ({ ...acc, [m.role]: (acc[m.role] ?? 0) + 1 }),
      {},
    );
    const data = roles.map((r) => ({ ...r.toJSON(), memberCount: counts[r.name] ?? 0 }));
    return { data, total: data.length };
  }

  async createRole(dto: CreateRoleDto) {
    await this.ensureDefaultRole();
    const name = dto.name.trim();
    if (await this.roleModel.exists({ name })) {
      throw new ConflictException('A role with this name already exists');
    }
    const ids = (await this.roleModel.find({}, 'id').exec()).map((r) => r.id);
    const role = await this.roleModel.create({
      id: nextSequenceId(ids, 'ROLE-', 3),
      name,
      pages: dto.pages ?? [],
    });
    return { message: 'Role created successfully', data: role };
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.roleModel.findOne({ id }).exec();
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    const previousName = role.name;
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name !== previousName && (await this.roleModel.exists({ name }))) {
        throw new ConflictException('A role with this name already exists');
      }
      role.name = name;
    }
    if (dto.pages !== undefined) role.pages = dto.pages;
    await role.save();

    if (role.name !== previousName) {
      await this.memberModel.updateMany({ role: previousName }, { $set: { role: role.name } }).exec();
    }
    return { message: 'Role updated successfully', data: role };
  }

  async removeRole(id: string) {
    const role = await this.roleModel.findOne({ id }).exec();
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    const inUse = await this.memberModel.countDocuments({ role: role.name }).exec();
    if (inUse > 0) {
      throw new BadRequestException(`Role is assigned to ${inUse} user(s); reassign them first`);
    }
    await role.deleteOne();
    return { message: 'Role deleted successfully', data: role };
  }

  /* ---------- members ---------- */

  async findMembers(status?: string, search?: string) {
    const filter: Record<string, any> = {};
    if (status === 'Active' || status === 'Inactive') filter.status = status;
    if (search?.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
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
      team: { id: 'TEAM-002', name: TEAM_NAME },
    };
  }

  async findMember(id: string) {
    const member = await this.memberModel.findOne({ id }).exec();
    if (!member) throw new NotFoundException(`User ${id} not found`);
    return member;
  }

  private async assertUnique(username: string, email: string, exceptId?: string) {
    if (RESERVED_USERNAMES.includes(username)) {
      throw new ConflictException('This username is already taken');
    }
    const clash = await this.memberModel
      .findOne({ $or: [{ username }, { email }], ...(exceptId ? { id: { $ne: exceptId } } : {}) })
      .exec();
    if (clash) {
      throw new ConflictException(
        clash.username === username ? 'This username is already taken' : 'This email is already used',
      );
    }
  }

  private async assertRoleExists(name: string) {
    await this.ensureDefaultRole();
    if (!(await this.roleModel.exists({ name }))) {
      throw new BadRequestException(`Role "${name}" does not exist`);
    }
  }

  async createMember(dto: CreateMemberDto) {
    const email = dto.email.toLowerCase();
    const role = dto.role ?? DEFAULT_ROLE_NAME;

    await this.assertRoleExists(role);

    const prefix = rolePrefix(role);
    const sameRole = (await this.memberModel.find({ id: new RegExp(`^${prefix}\\d{3,}$`) }, 'id').exec())
      .map((m) => m.id);
    const id = nextSequenceId(sameRole, prefix, 3);

    // The login username is the member ID unless one is given explicitly.
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

  async updateMember(id: string, dto: UpdateMemberDto) {
    const member = await this.findMember(id);
    const username = dto.username?.toLowerCase() ?? member.username;
    const email = dto.email?.toLowerCase() ?? member.email;

    if (dto.role !== undefined) await this.assertRoleExists(dto.role);
    if (username !== member.username || email !== member.email) {
      await this.assertUnique(username, email, id);
    }

    if (dto.name !== undefined) member.name = dto.name.trim();
    if (dto.phone !== undefined) member.phone = dto.phone.trim();
    if (dto.role !== undefined) member.role = dto.role;
    if (dto.status !== undefined) member.status = dto.status;
    member.username = username;
    member.email = email;
    if (dto.password) member.passwordHash = await bcrypt.hash(dto.password, 10);

    await member.save();
    return { message: 'User updated successfully', data: member };
  }

  async setMemberStatus(id: string, status: 'Active' | 'Inactive') {
    return this.updateMember(id, { status });
  }

  async resetPassword(id: string, password: string) {
    const member = await this.findMember(id);
    member.passwordHash = await bcrypt.hash(password, 10);
    await member.save();
    return { message: 'Password reset successfully', data: member };
  }

  async removeMember(id: string) {
    const member = await this.memberModel.findOneAndDelete({ id }).exec();
    if (!member) throw new NotFoundException(`User ${id} not found`);
    return { message: 'User deleted successfully', data: member };
  }

  /* ---------- sign-in ---------- */

  async allowedPages(roleName: string) {
    await this.ensureDefaultRole();
    const role =
      (await this.roleModel.findOne({ name: roleName }).exec()) ??
      (await this.roleModel.findOne({ name: DEFAULT_ROLE_NAME }).exec());
    return ['/dashboard', ...(role?.pages ?? []).filter((p) => (PAGE_HREFS as readonly string[]).includes(p))];
  }

  async login(dto: MemberLoginDto) {
    const member = await this.memberModel
      .findOne({ username: dto.username.trim().toLowerCase() })
      .exec();

    const valid = member && (await bcrypt.compare(dto.password, member.passwordHash));
    if (!member || !valid || member.status !== 'Active') {
      throw new UnauthorizedException(
        'Username or password is incorrect, or this account is inactive.',
      );
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
        // Shown under the user's name in the dashboard: their role (e.g. Operations Manager).
        teamName: member.role || TEAM_NAME,
      },
      allowedPages: await this.allowedPages(member.role),
    };
  }
}
