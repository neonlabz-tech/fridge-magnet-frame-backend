import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import {
  AddFollowUpDto,
  ConvertLeadDto,
  CreateLeadDto,
  ImportLeadsDto,
  ReassignLeadsDto,
  UpdateLeadDto,
  UpsertTargetDto,
} from './dto/lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(
    @Query('owner') owner?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
  ) {
    return this.leadsService.findAll({ owner, status, source, search });
  }

  @Get('targets')
  findTargets() {
    return this.leadsService.findTargets();
  }

  @Put('targets/:username')
  upsertTarget(@Param('username') username: string, @Body() dto: UpsertTargetDto) {
    return this.leadsService.upsertTarget(username, dto);
  }

  /** Bulk create (CSV import). Leads whose ID already exists are skipped. */
  @Post('import')
  importMany(@Body() dto: ImportLeadsDto) {
    return this.leadsService.importMany(dto);
  }

  @Post('reassign')
  reassign(@Body() dto: ReassignLeadsDto) {
    return this.leadsService.reassign(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { data: await this.leadsService.findOne(id) };
  }

  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Post(':id/follow-ups')
  addFollowUp(@Param('id') id: string, @Body() dto: AddFollowUpDto) {
    return this.leadsService.addFollowUp(id, dto);
  }

  @Post(':id/convert')
  convert(@Param('id') id: string, @Body() dto: ConvertLeadDto) {
    return this.leadsService.convert(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
