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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mail_service_1 = require("../mail/mail.service");
let ContactService = class ContactService {
    constructor(mail, config) {
        this.mail = mail;
        this.config = config;
    }
    esc(s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    async send(dto) {
        const subject = dto.subject?.trim() || 'New Contact Form Message';
        const text = [
            `Name: ${dto.name}`,
            `Email: ${dto.email}`,
            `Subject: ${subject}`,
            '',
            'Message:',
            dto.message,
        ].join('\n');
        const cell = (label, value) => `<tr>
        <td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">${label}</td>
        <td style="padding:6px 12px;color:#434652">${this.esc(value)}</td>
      </tr>`;
        const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#002B73;margin-bottom:8px">Magnify — Contact Form</h2>
        <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
          ${cell('Name', dto.name)}
          ${cell('Email', dto.email)}
          ${cell('Subject', subject)}
        </table>
        <p style="font-weight:bold;color:#002B73;margin-bottom:8px">Message:</p>
        <div style="background:#F9FAFB;border-left:4px solid #002B73;padding:12px 16px;color:#434652;white-space:pre-wrap">${this.esc(dto.message)}</div>
      </div>
    `;
        try {
            await this.mail.sendMail({
                to: this.config.getOrThrow('CONTACT_EMAIL'),
                replyTo: dto.email,
                subject: `Contact Form: ${subject}`,
                text,
                html,
            });
            return { success: true, message: 'Message sent successfully' };
        }
        catch {
            throw new common_1.InternalServerErrorException('Unable to send message right now');
        }
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        config_1.ConfigService])
], ContactService);
//# sourceMappingURL=contact.service.js.map