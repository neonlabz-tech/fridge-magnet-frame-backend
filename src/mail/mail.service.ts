import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string | undefined;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const port = Number(config.get<string>('SMTP_PORT') || 587);
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    this.fromAddress = config.get<string>('SMTP_FROM') || user;

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP config missing (SMTP_HOST / SMTP_USER / SMTP_PASS) — email sending is disabled',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      this.logger.log('SMTP transporter is ready');
    } catch (error) {
      this.logger.error('SMTP transporter verification failed', error instanceof Error ? error.stack : String(error));
    }
  }

  async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP not configured — cannot send email');
    }
    try {
      await this.transporter.sendMail({ from: this.fromAddress, ...options });
      this.logger.log(`[Mail] Email sent to ${options.to}: ${options.subject}`);
    } catch (err) {
      this.logger.error(
        `[Mail] Failed to send email to ${options.to}: ` +
          (err instanceof Error ? err.message : String(err)),
      );
      throw err;
    }
  }

  async sendOrderStatusUpdate(opts: {
    to: string;
    customerName: string;
    orderId: string;
    newStatus: string;
    adminNote?: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `[Mail] Skipped status email to ${opts.to} — SMTP not configured`,
      );
      return;
    }

    const statusLabel =
      opts.newStatus.charAt(0).toUpperCase() +
      opts.newStatus.slice(1).toLowerCase();

    const noteHtml = opts.adminNote
      ? `<p style="color:#434652"><em>Note from our team: ${opts.adminNote}</em></p>`
      : '';

    const noteText = opts.adminNote
      ? `\n\nNote from our team: ${opts.adminNote}`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#002B73;margin-bottom:8px">Magnify — Order Update</h2>
        <p style="color:#434652">Dear <strong>${opts.customerName}</strong>,</p>
        <p style="color:#434652">
          Your order <strong>#${opts.orderId}</strong> has been updated to:
        </p>
        <p style="font-size:22px;font-weight:bold;color:#BC0000;margin:16px 0">
          ${statusLabel}
        </p>
        ${noteHtml}
        <p style="color:#434652;margin-top:24px">Thank you for shopping with Magnify!</p>
        <hr style="border:none;border-top:1px solid #EEF1F5;margin:24px 0"/>
        <p style="font-size:12px;color:#9CA3AF">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    const text =
      `Dear ${opts.customerName},\n\n` +
      `Your order #${opts.orderId} has been updated to: ${statusLabel}.` +
      noteText +
      `\n\nThank you for shopping with Magnify!`;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: opts.to,
        subject: `Your Magnify Order #${opts.orderId} — Status: ${statusLabel}`,
        html,
        text,
      });
      this.logger.log(
        `[Mail] Status email sent to ${opts.to} for order #${opts.orderId} (${statusLabel})`,
      );
    } catch (err) {
      this.logger.error(
        `[Mail] Failed to send status email to ${opts.to} for order #${opts.orderId}: ` +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }
}
