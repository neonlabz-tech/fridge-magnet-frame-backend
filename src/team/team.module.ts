import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import {
  TeamMember,
  TeamMemberSchema,
  TeamRole,
  TeamRoleSchema,
} from './schemas/team.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TeamMember.name, schema: TeamMemberSchema },
      { name: TeamRole.name, schema: TeamRoleSchema },
    ]),
  ],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
