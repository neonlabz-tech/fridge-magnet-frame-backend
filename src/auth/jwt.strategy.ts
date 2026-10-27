import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { Admin } from '../schemas/admin.schema';
import { TeamMember, TeamMemberDocument } from '../team/schemas/team.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(TeamMember.name) private teamMemberModel: Model<TeamMemberDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: any) {
    if (payload.role === 'admin') {
      const admin = await this.adminModel.findById(payload.sub);
      if (!admin) throw new UnauthorizedException();
      return { userId: admin._id.toString(), email: admin.email, role: 'admin' };
    }

    if (payload.role === 'member') {
      const member = await this.teamMemberModel.findById(payload.sub);
      if (!member || member.status !== 'Active') throw new UnauthorizedException();
      return {
        userId: member._id.toString(),
        email: member.email,
        username: member.username,
        role: 'member',
      };
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user) throw new UnauthorizedException();
    return { userId: user._id.toString(), email: user.email, role: user.role };
  }
}
