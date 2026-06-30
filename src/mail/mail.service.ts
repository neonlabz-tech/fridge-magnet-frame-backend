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

// 2 s minimum between consecutive sends — prevents burst patterns that trip
// Gmail's abuse-detection heuristics even for legitimate transactional mail.
const MIN_SEND_GAP_MS = 2000;

// Backoff delays for retries (2 retries after the first attempt).
// Longer gaps look less like automated hammering to receiving infrastructure.
const RETRY_DELAYS_MS = [3000, 6000] as const;

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
    this.fromAddress = config.get<string>('SMTP_FROM') || this.cfgUser || '';
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

    // If Google ever surfaces a "suspicious sign-in" alert for this account and
    // it wasn't confirmed as "Yes, it was me", subsequent sends will be silently
    // throttled or dropped even after a 250 OK. Check this URL on each deploy.
    this.logger.warn(
      `[Mail] SECURITY CHECK: visit https://myaccount.google.com/security-checkup` +
        ` and confirm no unreviewed alerts for ${this.cfgUser}`,
    );

    // Force IPv4: this server's IPv6 path to smtp.gmail.com returns EHOSTUNREACH.
    // Node.js resolves AAAA first; nodemailer does not fall back to A automatically.
    let connectHost = this.cfgHost;
    try {
      const [ipv4] = await resolve4(this.cfgHost);
      connectHost = ipv4;
      this.logger.log(`[Mail] ${this.cfgHost} → IPv4 ${ipv4}`);
    } catch (dnsErr) {
      this.logger.warn(
        `[Mail] IPv4 lookup failed for ${this.cfgHost}: ` +
          (dnsErr instanceof Error ? dnsErr.message : String(dnsErr)) +
          ' — using hostname (may try IPv6)',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: connectHost,
      port: this.cfgPort,
      secure: this.cfgSecure,
      auth: { user: this.cfgUser, pass: this.cfgPass },
      tls: { servername: this.cfgHost }, // SNI must carry real hostname when dialling an IP
      // Pool keeps one persistent connection; rate limiting enforced at transport level.
      pool: true,
      maxConnections: 1,
      maxMessages: 5,   // recycle connection every 5 messages (Gmail tolerates long-lived but 5 is safe)
      rateDelta: 1000,  // 1 s window
      rateLimit: 1,     // max 1 message per rateDelta — our 2 s app-level throttle is more conservative anyway
    });

    try {
      await this.transporter.verify();
      this.logger.log(
        `[Mail] SMTP ready — ${connectHost}:${this.cfgPort} | from: ${this.fromAddress}`,
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

  // ─── Rate-limit: enforce minimum gap between sends ────────────────────────

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
      // Explicitly mark as normal priority — omitting this can cause some MTAs
      // to infer high-priority, which is a spam fingerprint for bulk senders.
      priority: 'normal',
      headers: {
        // Identifies the sending app without leaking tech stack details.
        'X-Mailer': 'Magnify',
      },
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
            `  to          : ${Array.isArray(message.to) ? (message.to as string[]).join(', ') : message.to}\n` +
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
      await this.doSend(options, label);
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
      await this.doSend(
        {
          from: `Magnify Orders <${this.cfgUser ?? ''}>`,
          to: opts.to,
          subject: `Your Magnify order #${opts.orderId} is now ${statusLabel}`,
          html,
          text,
          // List-Unsubscribe signals to Gmail that this is legitimate transactional
          // mail from a sender who respects unsubscribe requests — positive deliverability signal.
          headers: {
            'List-Unsubscribe': `<mailto:${this.cfgUser}>`,
          },
        },
        label,
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
