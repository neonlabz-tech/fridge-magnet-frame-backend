import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CommissionTier,
  CommissionTierDocument,
  FollowUp,
  Lead,
  LeadDocument,
  LeadTarget,
  LeadTargetDocument,
} from './schemas/lead.schema';
import {
  AddFollowUpDto,
  ConvertLeadDto,
  CreateLeadDto,
  ImportLeadsDto,
  ReassignLeadsDto,
  UpdateLeadDto,
  UpsertCommissionTierDto,
  UpsertTargetDto,
} from './dto/lead.dto';
import { escapeRegex, nextSequenceId } from '../common/utils/clean-json';

export interface LeadQuery {
  owner?: string;
  status?: string;
  source?: string;
  search?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private readonly model: Model<LeadDocument>,
    @InjectModel(LeadTarget.name)
    private readonly targetModel: Model<LeadTargetDocument>,
    @InjectModel(CommissionTier.name)
    private readonly tierModel: Model<CommissionTierDocument>,
  ) {}

  private systemEntry(by: string, notes: string): FollowUp {
    return {
      n: 0,
      at: new Date().toISOString(),
      by,
      callStatus: '',
      result: '',
      product: '',
      nextFollowUp: '',
      system: true,
      notes,
    };
  }

  private nextFollowUpNumber(lead: LeadDocument) {
    return lead.history.filter((h) => !h.system).length + 1;
  }

  async findAll(q: LeadQuery) {
    const filter: Record<string, any> = {};
    if (q.owner !== undefined) filter.owner = q.owner;
    if (q.status) filter.status = q.status;
    if (q.source) filter.source = q.source;
    if (q.search?.trim()) {
      const rx = new RegExp(escapeRegex(q.search.trim()), 'i');
      filter.$or = [{ id: rx }, { business: rx }, { phone: rx }, { email: rx }];
    }

    const data = await this.model.find(filter).sort({ createdAt: -1 }).exec();
    return { data, total: data.length };
  }

  async findOne(id: string) {
    const lead = await this.model.findOne({ id }).exec();
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  private digits(p?: string) {
    return String(p ?? '').replace(/\D/g, '');
  }

  /** A phone number can belong to one lead only. */
  private async assertPhoneFree(phone: string | undefined, exceptId?: string) {
    const d = this.digits(phone);
    if (!d) return;
    const clash = await this.model
      .findOne({ phone: d, ...(exceptId ? { id: { $ne: exceptId } } : {}) }, 'id')
      .exec();
    if (clash) {
      throw new BadRequestException(`This phone number is already uploaded in lead ${clash.id}.`);
    }
  }

  async create(dto: CreateLeadDto) {
    await this.assertPhoneFree(dto.phone);
    const ids = (await this.model.find({}, 'id').exec()).map((l) => l.id);
    const id = dto.id && !ids.includes(dto.id) ? dto.id : nextSequenceId(ids, 'ML', 3);
    const { actor, ...fields } = dto;
    void actor;

    const lead = await this.model.create({
      ...fields,
      phone: this.digits(fields.phone),
      id,
      dateAdded: dto.dateAdded ?? new Date().toISOString(),
    });
    return { message: 'Lead created successfully', data: lead };
  }

  async importMany(dto: ImportLeadsDto) {
    const existing = await this.model.find({}, 'id phone').exec();
    const used = new Set(existing.map((l) => l.id));
    const phones = new Set(existing.map((l) => this.digits(l.phone)).filter(Boolean));
    const ids = [...used];
    const base = Date.now();
    const docs: Record<string, any>[] = [];
    let skipped = 0;

    for (const row of dto.leads) {
      const { actor, ...fields } = row;
      void actor;
      const phone = this.digits(row.phone);
      if ((row.id && used.has(row.id)) || (phone && phones.has(phone))) {
        skipped += 1;
        continue;
      }
      if (phone) phones.add(phone);
      const id = row.id || nextSequenceId(ids, 'ML', 3);
      used.add(id);
      ids.push(id);
      docs.push({
        ...fields,
        phone,
        id,
        dateAdded: row.dateAdded ?? new Date().toISOString(),
        // File order = creation order, so the last row shows first (newest first).
        createdAt: new Date(base + docs.length),
      });
    }

    if (docs.length) await this.model.insertMany(docs);
    return {
      message: `${docs.length} lead(s) imported, ${skipped} skipped`,
      created: docs.length,
      skipped,
    };
  }

  async update(id: string, dto: UpdateLeadDto) {
    const lead = await this.findOne(id);
    const { actor, ...fields } = dto;
    if (fields.phone !== undefined) {
      // Only checked when the number actually changes (older duplicates stay editable).
      if (this.digits(fields.phone) !== this.digits(lead.phone)) await this.assertPhoneFree(fields.phone, id);
      fields.phone = this.digits(fields.phone);
    }

    if (fields.owner !== undefined && fields.owner !== lead.owner) {
      lead.history.push(
        this.systemEntry(
          actor ?? 'admin',
          `Reassigned from ${lead.owner || 'Unassigned'} to ${fields.owner || 'Unassigned'}.`,
        ),
      );
      lead.markModified('history');
    }

    Object.assign(lead, fields);
    if (fields.history) lead.markModified('history');
    await lead.save();
    return { message: 'Lead updated successfully', data: lead };
  }

  async addFollowUp(id: string, dto: AddFollowUpDto) {
    const lead = await this.findOne(id);
    const entry: FollowUp = {
      n: this.nextFollowUpNumber(lead),
      at: new Date().toISOString(),
      by: dto.by ?? lead.owner ?? 'admin',
      callStatus: dto.callStatus,
      result: dto.result ?? '',
      product: dto.product ?? lead.product,
      notes: dto.notes ?? '',
      nextFollowUp: dto.nextFollowUp ?? '',
    };

    lead.history.push(entry);
    lead.markModified('history');
    lead.callStatus = dto.callStatus;
    if (dto.result !== undefined) lead.result = dto.result;
    if (dto.product) lead.product = dto.product;
    lead.nextFollowUp = dto.nextFollowUp ?? '';
    if (lead.status === 'New') lead.status = 'Connected';
    if (lead.nextFollowUp && lead.status !== 'Converted' && lead.status !== 'Lost') {
      lead.status = 'Follow Up';
    }

    await lead.save();
    return { message: 'Follow-up added successfully', data: lead };
  }

  async convert(id: string, dto: ConvertLeadDto) {
    const lead = await this.findOne(id);
    const by = dto.by ?? lead.owner ?? 'admin';
    const now = new Date().toISOString();

    if (!lead.customerId) {
      const used = (await this.model.find({ customerId: { $exists: true } }, 'customerId').exec())
        .map((l) => l.customerId as string);
      lead.customerId = nextSequenceId(used, 'CL-', 3);
    }

    lead.history.push({
      n: this.nextFollowUpNumber(lead),
      at: now,
      by,
      callStatus: 'Answered',
      result: 'Converted',
      product: dto.product,
      notes: 'Lead converted to a client.',
      nextFollowUp: '',
    });
    lead.markModified('history');

    lead.status = 'Converted';
    lead.result = 'Converted';
    lead.callStatus = 'Answered';
    lead.nextFollowUp = '';
    lead.product = dto.product;
    lead.order = {
      product: dto.product,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      total: dto.quantity * dto.unitPrice,
      address: dto.address ?? lead.address,
      phone: dto.phone ?? lead.phone,
      convertedAt: now,
    };

    await lead.save();
    return { message: 'Lead converted successfully', data: lead };
  }

  /** Move every non-converted lead from one operator to another. */
  async reassign(dto: ReassignLeadsDto) {
    const leads = await this.model
      .find({ owner: dto.from, status: { $ne: 'Converted' } })
      .exec();

    for (const lead of leads) {
      lead.history.push(
        this.systemEntry('admin', `Reassigned from ${dto.from} to ${dto.to || 'Unassigned'}.`),
      );
      lead.markModified('history');
      lead.owner = dto.to;
      await lead.save();
    }

    return { message: `${leads.length} lead(s) reassigned`, moved: leads.length };
  }

  async remove(id: string) {
    const lead = await this.model.findOneAndDelete({ id }).exec();
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return { message: 'Lead deleted successfully', data: lead };
  }

  /* ---------- targets ---------- */

  async findTargets() {
    const list = await this.targetModel.find().exec();
    const data = Object.fromEntries(list.map((t) => [t.username, t.toJSON()]));
    return { data };
  }

  async upsertTarget(username: string, dto: UpsertTargetDto) {
    const target = await this.targetModel
      .findOneAndUpdate(
        { username: username.toLowerCase() },
        { $set: dto },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
    return { message: 'Targets saved successfully', data: target };
  }

  /* ---------- commission tiers ---------- */

  async findTiers() {
    // First use: seed the standard slabs (below 270,000 = 0%, 270,000+ = 2%, 310,000+ = 3%).
    if ((await this.tierModel.estimatedDocumentCount().exec()) === 0) {
      await this.tierModel.insertMany([
        { id: 'TIER-001', minSales: 0, rate: 0 },
        { id: 'TIER-002', minSales: 270000, rate: 2 },
        { id: 'TIER-003', minSales: 310000, rate: 3 },
      ]);
    }
    const data = await this.tierModel.find().sort({ minSales: 1 }).exec();
    return { data };
  }

  async createTier(dto: UpsertCommissionTierDto) {
    if (await this.tierModel.exists({ minSales: dto.minSales })) {
      throw new BadRequestException('A tier starting at this sales amount already exists.');
    }
    const ids = (await this.tierModel.find({}, 'id').exec()).map((t) => t.id);
    const id = nextSequenceId(ids, 'TIER-', 3);
    const tier = await this.tierModel.create({ ...dto, id });
    return { message: 'Commission tier added', data: tier };
  }

  async updateTier(id: string, dto: UpsertCommissionTierDto) {
    if (await this.tierModel.exists({ minSales: dto.minSales, id: { $ne: id } })) {
      throw new BadRequestException('A tier starting at this sales amount already exists.');
    }
    const tier = await this.tierModel
      .findOneAndUpdate({ id }, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!tier) throw new NotFoundException(`Commission tier ${id} not found`);
    return { message: 'Commission tier updated', data: tier };
  }

  async removeTier(id: string) {
    const tier = await this.tierModel.findOneAndDelete({ id }).exec();
    if (!tier) throw new NotFoundException(`Commission tier ${id} not found`);
    return { message: 'Commission tier deleted', data: tier };
  }
}
