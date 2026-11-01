import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import {
  CommissionTier,
  CommissionTierSchema,
  Lead,
  LeadSchema,
  LeadTarget,
  LeadTargetSchema,
} from './schemas/lead.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: LeadTarget.name, schema: LeadTargetSchema },
      { name: CommissionTier.name, schema: CommissionTierSchema },
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
