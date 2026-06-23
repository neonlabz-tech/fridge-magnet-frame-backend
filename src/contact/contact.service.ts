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

    try {
      await this.mail.sendMail({
        to: this.config.getOrThrow<string>('CONTACT_EMAIL'),
        replyTo: dto.email,
        subject: `Contact Form: ${subject}`,
        text,
      });

      return { success: true, message: 'Message sent successfully' };
    } catch {
      throw new InternalServerErrorException('Unable to send message right now');
    }
  }
}