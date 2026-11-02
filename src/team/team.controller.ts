import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TeamService } from './team.service';
import {
  ChangePasswordDto,
  CreateMemberDto,
  CreateRoleDto,
  MemberLoginDto,
  ResetPasswordDto,
  UpdateMemberDto,
  UpdateRoleDto,
} from './dto/team.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: MemberLoginDto) {
    return this.teamService.login(dto);
  }

  /** The signed-in member changes their own password. */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(200)
  changePassword(
    @Request() req: { user: { userId: string; role?: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.teamService.changeOwnPassword(req.user.userId, dto);
  }

  /** Is this sign-in still valid? (401 after a password change/reset or when the account is disabled.) */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: { user: { userId: string } }) {
    return this.teamService.me(req.user.userId);
  }

  /* roles */

  @Get('roles')
  findRoles() {
    return this.teamService.findRoles();
  }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.teamService.createRole(dto);
  }

  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.teamService.updateRole(id, dto);
  }

  @Put('roles/:id')
  replaceRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.teamService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  removeRole(@Param('id') id: string) {
    return this.teamService.removeRole(id);
  }

  /* members */

  @Get('members')
  findMembers(@Query('status') status?: string, @Query('search') search?: string) {
    return this.teamService.findMembers(status, search);
  }

  @Get('members/:id')
  async findMember(@Param('id') id: string) {
    return { data: await this.teamService.findMember(id) };
  }

  @Post('members')
  createMember(@Body() dto: CreateMemberDto) {
    return this.teamService.createMember(dto);
  }

  @Patch('members/:id/status')
  setStatus(@Param('id') id: string, @Body('status') status: 'Active' | 'Inactive') {
    return this.teamService.setMemberStatus(id, status);
  }

  @Post('members/:id/reset-password')
  @HttpCode(200)
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.teamService.resetPassword(id, dto.password);
  }

  @Patch('members/:id')
  updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.teamService.updateMember(id, dto);
  }

  @Put('members/:id')
  replaceMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.teamService.updateMember(id, dto);
  }

  @Delete('members/:id')
  removeMember(@Param('id') id: string) {
    return this.teamService.removeMember(id);
  }
}
