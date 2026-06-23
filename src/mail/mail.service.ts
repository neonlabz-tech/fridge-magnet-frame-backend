import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS').replace(/\s/g, ''),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.verify();
      this.logger.log('SMTP transporter is ready');
    } catch (error) {
      this.logger.error('SMTP transporter verification failed', error instanceof Error ? error.stack : String(error));
    }
  }

  verify(): Promise<true> {
    return this.transporter.verify();
  }

  async sendMail(options: { to: string; subject: string; text: string; html?: string; replyTo?: string }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.getOrThrow<string>('SMTP_FROM'),
        ...options,
      });
    } catch (error) {
      this.logger.error(`Email delivery failed: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
