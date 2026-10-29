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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const lead_schema_1 = require("./schemas/lead.schema");
const clean_json_1 = require("../common/utils/clean-json");
let LeadsService = class LeadsService {
    constructor(model, targetModel) {
        this.model = model;
        this.targetModel = targetModel;
    }
    systemEntry(by, notes) {
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
    nextFollowUpNumber(lead) {
        return lead.history.filter((h) => !h.system).length + 1;
    }
    async findAll(q) {
        const filter = {};
        if (q.owner !== undefined)
            filter.owner = q.owner;
        if (q.status)
            filter.status = q.status;
        if (q.source)
            filter.source = q.source;
        if (q.search?.trim()) {
            const rx = new RegExp((0, clean_json_1.escapeRegex)(q.search.trim()), 'i');
            filter.$or = [{ id: rx }, { business: rx }, { phone: rx }, { email: rx }];
        }
        const data = await this.model.find(filter).sort({ createdAt: -1 }).exec();
        return { data, total: data.length };
    }
    async findOne(id) {
        const lead = await this.model.findOne({ id }).exec();
        if (!lead)
            throw new common_1.NotFoundException(`Lead ${id} not found`);
        return lead;
    }
    async create(dto) {
        const ids = (await this.model.find({}, 'id').exec()).map((l) => l.id);
        const id = dto.id && !ids.includes(dto.id) ? dto.id : (0, clean_json_1.nextSequenceId)(ids, 'ML', 3);
        const { actor, ...fields } = dto;
        void actor;
        const lead = await this.model.create({
            ...fields,
            id,
            dateAdded: dto.dateAdded ?? new Date().toISOString(),
        });
        return { message: 'Lead created successfully', data: lead };
    }
    async importMany(dto) {
        const used = new Set((await this.model.find({}, 'id').exec()).map((l) => l.id));
        const ids = [...used];
        const base = Date.now();
        const docs = [];
        let skipped = 0;
        for (const row of dto.leads) {
            const { actor, ...fields } = row;
            void actor;
            if (row.id && used.has(row.id)) {
                skipped += 1;
                continue;
            }
            const id = row.id || (0, clean_json_1.nextSequenceId)(ids, 'ML', 3);
            used.add(id);
            ids.push(id);
            docs.push({
                ...fields,
                id,
                dateAdded: row.dateAdded ?? new Date().toISOString(),
                createdAt: new Date(base + docs.length),
            });
        }
        if (docs.length)
            await this.model.insertMany(docs);
        return {
            message: `${docs.length} lead(s) imported, ${skipped} skipped`,
            created: docs.length,
            skipped,
        };
    }
    async update(id, dto) {
        const lead = await this.findOne(id);
        const { actor, ...fields } = dto;
        if (fields.owner !== undefined && fields.owner !== lead.owner) {
            lead.history.push(this.systemEntry(actor ?? 'admin', `Reassigned from ${lead.owner || 'Unassigned'} to ${fields.owner || 'Unassigned'}.`));
            lead.markModified('history');
        }
        Object.assign(lead, fields);
        if (fields.history)
            lead.markModified('history');
        await lead.save();
        return { message: 'Lead updated successfully', data: lead };
    }
    async addFollowUp(id, dto) {
        const lead = await this.findOne(id);
        const entry = {
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
        if (dto.result !== undefined)
            lead.result = dto.result;
        if (dto.product)
            lead.product = dto.product;
        lead.nextFollowUp = dto.nextFollowUp ?? '';
        if (lead.status === 'New')
            lead.status = 'Connected';
        if (lead.nextFollowUp && lead.status !== 'Converted' && lead.status !== 'Lost') {
            lead.status = 'Follow Up';
        }
        await lead.save();
        return { message: 'Follow-up added successfully', data: lead };
    }
    async convert(id, dto) {
        const lead = await this.findOne(id);
        const by = dto.by ?? lead.owner ?? 'admin';
        const now = new Date().toISOString();
        if (!lead.customerId) {
            const used = (await this.model.find({ customerId: { $exists: true } }, 'customerId').exec())
                .map((l) => l.customerId);
            lead.customerId = (0, clean_json_1.nextSequenceId)(used, 'CL-', 3);
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
    async reassign(dto) {
        const leads = await this.model
            .find({ owner: dto.from, status: { $ne: 'Converted' } })
            .exec();
        for (const lead of leads) {
            lead.history.push(this.systemEntry('admin', `Reassigned from ${dto.from} to ${dto.to || 'Unassigned'}.`));
            lead.markModified('history');
            lead.owner = dto.to;
            await lead.save();
        }
        return { message: `${leads.length} lead(s) reassigned`, moved: leads.length };
    }
    async remove(id) {
        const lead = await this.model.findOneAndDelete({ id }).exec();
        if (!lead)
            throw new common_1.NotFoundException(`Lead ${id} not found`);
        return { message: 'Lead deleted successfully', data: lead };
    }
    async findTargets() {
        const list = await this.targetModel.find().exec();
        const data = Object.fromEntries(list.map((t) => [t.username, t.toJSON()]));
        return { data };
    }
    async upsertTarget(username, dto) {
        const target = await this.targetModel
            .findOneAndUpdate({ username: username.toLowerCase() }, { $set: dto }, { new: true, upsert: true, setDefaultsOnInsert: true })
            .exec();
        return { message: 'Targets saved successfully', data: target };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __param(1, (0, mongoose_1.InjectModel)(lead_schema_1.LeadTarget.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], LeadsService);
//# sourceMappingURL=leads.service.js.map