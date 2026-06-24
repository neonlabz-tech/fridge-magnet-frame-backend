import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { resolve4 } from 'dns/promises';

interface SentInfo {
  messageId?: string;
  response?: string;
  accepted?: string[];
  rejected?: string[];
}

interface SmtpError extends Error {
  code?: string;
  command?: string;
  response?: string;
  responseCode?: number;
}

// Minimum gap enforced between consecutive sends so the pattern doesn't
// look like a burst to Gmail's abuse-detection heuristics.
const MIN_SEND_GAP_MS = 1500;

// Delays before each retry attempt (2 retries total after the first try).
const RETRY_DELAYS_MS = [2000, 4000] as const;

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
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;
  private replyToAddress: string;
  private lastSendTime = 0;

  private readonly cfgHost: string | undefined;
  private readonly cfgPort: number;
  private readonly cfgSecure: boolean;
  private readonly cfgUser: string | undefined;
  private readonly cfgPass: string | undefined;

  constructor(config: ConfigService) {
    this.cfgHost = config.get<string>('SMTP_HOST');
    this.cfgPort = Number(config.get<string>('SMTP_PORT') || 587);
    const secureEnv = config.get<string>('SMTP_SECURE');
    this.cfgSecure =
      secureEnv !== undefined ? secureEnv === 'true' : this.cfgPort === 465;
    this.cfgUser = config.get<string>('SMTP_USER');
    this.cfgPass = config.get<string>('SMTP_PASS')?.replace(/\s/g, '');
    this.fromAddress =
      config.get<string>('SMTP_FROM') || this.cfgUser || '';
    this.replyToAddress =
      config.get<string>('SMTP_REPLY_TO') || this.cfgUser || '';

    if (!this.cfgHost || !this.cfgUser || !this.cfgPass) {
      this.logger.warn(
        '[Mail] SMTP config incomplete (need SMTP_HOST / SMTP_USER / SMTP_PASS) — email disabled',
      );
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.cfgHost || !this.cfgUser || !this.cfgPass) return;

    // ── Security reminder ────────────────────────────────────────────────────
    this.logger.warn(
      '[Mail] SECURITY REMINDER: Before relying on email delivery, verify that ' +
        'https://myaccount.google.com/security-checkup shows NO unusual access ' +
        'alerts or blocked sign-ins for the sending account (' +
        this.cfgUser +
        ').',
    );

    // ── Force IPv4 ──────────────────────────────────────────────────────────
    // On this machine IPv6 to smtp.gmail.com is blocked (EHOSTUNREACH).
    // Node.js tries AAAA first; nodemailer does not retry on A automatically.
    let connectHost = this.cfgHost;
    try {
      const [ipv4] = await resolve4(this.cfgHost);
      connectHost = ipv4;
      this.logger.log(
        `[Mail] ${this.cfgHost} → IPv4 ${ipv4} (IPv6 blocked on this network)`,
      );
    } catch (dnsErr) {
      this.logger.warn(
        `[Mail] IPv4 DNS lookup failed for ${this.cfgHost}: ` +
          (dnsErr instanceof Error ? dnsErr.message : String(dnsErr)) +
          ' — falling back to hostname (may use IPv6)',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: connectHost,
      port: this.cfgPort,
      secure: this.cfgSecure,
      auth: { user: this.cfgUser, pass: this.cfgPass },
      // SNI must carry the real hostname when connecting via IP address
      tls: { servername: this.cfgHost },
    });

    // ── verify() — confirms TCP connection + AUTH before any send ───────────
    try {
      await this.transporter.verify();
      this.logger.log(
        `[Mail] verify() OK — ${connectHost}:${this.cfgPort} | user: ${this.cfgUser}`,
      );
    } catch (err) {
      const e = err as SmtpError;
      this.logger.error(
        `[Mail] verify() FAILED\n` +
          `  host        : ${connectHost}:${this.cfgPort}\n` +
          `  code        : ${e.code ?? '—'}\n` +
          `  command     : ${e.command ?? '—'}\n` +
          `  responseCode: ${e.responseCode ?? '—'}\n` +
          `  response    : ${e.response ?? '—'}\n` +
          `  message     : ${e.message}`,
      );
      this.transporter = null;
    }
  }

  // ─── Rate-limit helper ────────────────────────────────────────────────────

  private async throttle(): Promise<void> {
    const gap = Date.now() - this.lastSendTime;
    if (gap < MIN_SEND_GAP_MS) {
      await new Promise<void>((r) => setTimeout(r, MIN_SEND_GAP_MS - gap));
    }
    this.lastSendTime = Date.now();
  }

  // ─── Internal helper: throttle → send → retry-with-backoff ───────────────

  private async doSend(
    message: nodemailer.SendMailOptions,
    label: string,
  ): Promise<SentInfo> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not ready (verify() failed at startup)');
    }

    const outgoing: nodemailer.SendMailOptions = {
      from: this.fromAddress,
      replyTo: this.replyToAddress,
      ...message,
    };

    let lastErr: unknown;
    const maxAttempts = 1 + RETRY_DELAYS_MS.length;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.throttle();
        const info: SentInfo = await this.transporter.sendMail(outgoing);
        this.logger.log(
          `[Mail] SENT ${label}${attempt > 1 ? ` (attempt ${attempt})` : ''}\n` +
            `  to          : ${Array.isArray(message.to) ? message.to.join(', ') : message.to}\n` +
            `  messageId   : ${info.messageId}\n` +
            `  response    : ${info.response}\n` +
            `  accepted    : ${info.accepted?.join(', ') || '—'}\n` +
            `  rejected    : ${info.rejected?.join(', ') || 'none'}`,
        );
        return info;
      } catch (err) {
        lastErr = err;
        if (attempt < maxAttempts) {
          const delay = RETRY_DELAYS_MS[attempt - 1];
          this.logger.warn(
            `[Mail] send failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms — ` +
              `${label} — ${(err as SmtpError).message ?? String(err)}`,
          );
          await new Promise<void>((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastErr;
  }

  private logSendError(err: unknown, label: string): void {
    const e = err as SmtpError;
    this.logger.error(
      `[Mail] FAILED ${label}\n` +
        `  code        : ${e.code ?? '—'}\n` +
        `  command     : ${e.command ?? '—'}\n` +
        `  responseCode: ${e.responseCode ?? '—'}\n` +
        `  response    : ${e.response ?? '—'}\n` +
        `  message     : ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  // Signatures unchanged — auth.service.ts and contact.service.ts call sendMail()
  // orders.service.ts calls sendOrderStatusUpdate()

  async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
  }): Promise<void> {
    try {
      await this.doSend(options, `→ ${options.to} | "${options.subject}"`);
    } catch (err) {
      this.logSendError(err, `→ ${options.to} | "${options.subject}"`);
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
    if (!this.transporter) {
      this.logger.warn(
        `[Mail] Order #${opts.orderId} — skipped (transporter not ready)`,
      );
      return { success: false, error: 'SMTP transporter not ready' };
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
        <p style="color:#434652;margin-top:24px">Thank you for shopping with Magnify!</p>
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
      `\n\nThank you for shopping with Magnify!\n\n` +
      `Questions about your order? Reply to this email and we will get back to you.`;

    const label = `order #${opts.orderId} → ${opts.to} (${statusLabel})`;
    try {
      await this.doSend(
        {
          from: `Magnify Orders <${this.cfgUser ?? ''}>`,
          to: opts.to,
          subject: `Your Magnify order #${opts.orderId} is now ${statusLabel}`,
          html,
          text,
        },
        label,
      );
      return { success: true };
    } catch (err) {
      this.logSendError(err, label);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
