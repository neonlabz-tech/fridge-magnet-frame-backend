import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private fromAddress: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.fromAddress = config.get<string>('RESEND_FROM') || '';
    this.resend = new Resend(apiKey || '');

    if (!apiKey || !this.fromAddress) {
      this.logger.warn(
        '[Mail] Resend config incomplete (need RESEND_API_KEY / RESEND_FROM) — email disabled',
      );
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.fromAddress) {
      this.logger.log(`[Mail] Resend ready | from: ${this.fromAddress}`);
    }
  }

  private logSendError(err: unknown, label: string): void {
    this.logger.error(
      `[Mail] FAILED ${label}\n` +
        `  message     : ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  private async sendWithResend(options: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    from?: string;
    replyTo?: string;
    headers?: Record<string, string>;
  }): Promise<string> {
    if (!this.fromAddress) {
      throw new Error('Resend from address not configured');
    }

    const result = await this.resend.emails.send({
      from: options.from || this.fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      headers: options.headers,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Failed to send email with Resend');
    }

    return result.data?.id || '';
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  // sendMail             — auth.service.ts (password reset), contact.service.ts
  // sendOrderStatusUpdate — orders.service.ts

  async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
  }): Promise<void> {
    const label = `→ ${options.to} | "${options.subject}"`;
    try {
      const messageId = await this.sendWithResend({
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        headers: {
          'X-Mailer': 'Magnify',
        },
      });
      this.logger.log(
        `[Mail] SENT ${label}\n` +
          `  to          : ${options.to}\n` +
          `  messageId   : ${messageId || 'n/a'}`,
      );
    } catch (err) {
      this.logSendError(err, label);
      throw err;
    }
  }

  async sendOrderStatusUpdate(opts: {
    to: string;
    customerName: string;
    orderId: string;
    newStatus: string;
    adminNote?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.fromAddress) {
      this.logger.warn(
        `[Mail] Order #${opts.orderId} — skipped (from address not ready)`,
      );
      return { success: false, error: 'Resend from address not ready' };
    }

    const statusLabel =
      opts.newStatus.charAt(0).toUpperCase() +
      opts.newStatus.slice(1).toLowerCase();

    const safeName = escapeHtml(opts.customerName);
    const safeOrderId = escapeHtml(opts.orderId);
    const safeStatus = escapeHtml(statusLabel);
    const safeNote = opts.adminNote ? escapeHtml(opts.adminNote) : null;

    const noteHtml = safeNote
      ? `<p style="color:#434652"><em>Note from our team: ${safeNote}</em></p>`
      : '';
    const noteText = opts.adminNote
      ? `\n\nNote from our team: ${opts.adminNote}`
      : '';

    // Spam-trigger review (checked against common Gmail heuristics):
    // Subject: no ALL-CAPS, no exclamation, no "free/urgent/act now" — clean.
    // Body: no financial trigger words, plain sentence structure — clean.
    // Links: none in order update body — clean.
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#002B73;margin-bottom:8px">Magnify — Order Update</h2>
        <p style="color:#434652">Dear <strong>${safeName}</strong>,</p>
        <p style="color:#434652">
          Your order <strong>#${safeOrderId}</strong> has been updated to:
        </p>
        <p style="font-size:22px;font-weight:bold;color:#BC0000;margin:16px 0">
          ${safeStatus}
        </p>
        ${noteHtml}
        <p style="color:#434652;margin-top:24px">Thank you for shopping with Magnify.</p>
        <hr style="border:none;border-top:1px solid #EEF1F5;margin:24px 0"/>
        <p style="font-size:12px;color:#9CA3AF">
          Questions about your order? Reply to this email and we will get back to you.
        </p>
      </div>
    `;
    const text =
      `Dear ${opts.customerName},\n\n` +
      `Your order #${opts.orderId} has been updated to: ${statusLabel}.` +
      noteText +
      `\n\nThank you for shopping with Magnify.\n\n` +
      `Questions about your order? Reply to this email.`;

    const label = `order #${opts.orderId} → ${opts.to} (${statusLabel})`;
    try {
      const messageId = await this.sendWithResend({
        from: `Magnify Orders <${this.fromAddress}>`,
        to: opts.to,
        subject: `Your Magnify order #${opts.orderId} is now ${statusLabel}`,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<mailto:${this.fromAddress}>`,
          'X-Mailer': 'Magnify',
        },
      });
      this.logger.log(
        `[Mail] SENT ${label}\n` +
          `  to          : ${opts.to}\n` +
          `  messageId   : ${messageId || 'n/a'}`,
      );
      return { success: true };
    } catch (err) {
      this.logSendError(err, label);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
