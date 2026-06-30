import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async send(dto: ContactDto) {
    const subject = dto.subject?.trim() || 'New Contact Form Message';

    const text = [
      `Name: ${dto.name}`,
      `Email: ${dto.email}`,
      `Subject: ${subject}`,
      '',
      'Message:',
      dto.message,
    ].join('\n');

    const cell = (label: string, value: string) =>
      `<tr>
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
        to: this.config.getOrThrow<string>('CONTACT_EMAIL'),
        replyTo: dto.email,
        subject: `Contact Form: ${subject}`,
        text,
        html,
      });

      return { success: true, message: 'Message sent successfully' };
    } catch {
      throw new InternalServerErrorException('Unable to send message right now');
    }
  }
}