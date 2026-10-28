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

  private readonly adminAddress: string;

  constructor(config: ConfigService) {
     const apiKey = (config.get<string>('RESEND_API_KEY') || '').trim();
    this.fromAddress = (config.get<string>('RESEND_FROM_EMAIL') || '').trim();
    this.adminAddress = (
      config.get<string>('ADMIN_EMAIL') ||
      config.get<string>('CONTACT_EMAIL') ||
      ''
    ).trim();
    // Resend throws on an empty key; a placeholder keeps the app booting with email disabled.
    this.resend = new Resend(apiKey || 're_email_disabled');

    if (!apiKey || !this.fromAddress) {
      this.logger.warn(
        '[Mail] Resend config incomplete (need RESEND_API_KEY / RESEND_FROM_EMAIL) — email disabled',
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

  async sendActivationEmail(opts: {
    to: string;
    fullName?: string;
    activationLink: string;
  }): Promise<void> {
    const safeName = escapeHtml(opts.fullName?.trim() || 'there');
    const safeLink = opts.activationLink;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#002B73;margin-bottom:8px">Welcome to Magnify!</h2>
        <p style="color:#434652">Hi <strong>${safeName}</strong>,</p>
        <p style="color:#434652">
          Thanks for registering. Please confirm your email address to activate your account.
          This link expires in <strong>24 hours</strong>.
        </p>
        <p style="margin:28px 0">
          <a href="${safeLink}"
             style="background:#002B73;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;font-size:15px">
            Activate my account
          </a>
        </p>
        <p style="font-size:13px;color:#9CA3AF">
          Or paste this link into your browser:<br/>
          <span style="word-break:break-all;color:#434652">${safeLink}</span>
        </p>
        <hr style="border:none;border-top:1px solid #EEF1F5;margin:24px 0"/>
        <p style="font-size:12px;color:#9CA3AF">
          If you did not create a Magnify account you can safely ignore this email.
        </p>
      </div>
    `;

    const text =
      `Hi ${opts.fullName?.trim() || 'there'},\n\n` +
      `Thanks for registering with Magnify. Please activate your account by visiting the link below (valid for 24 hours):\n\n` +
      `${safeLink}\n\n` +
      `If you did not create a Magnify account you can safely ignore this email.`;

    const label = `activation → ${opts.to}`;
    try {
      const messageId = await this.sendWithResend({
        from: `Magnify <${this.stripName(this.fromAddress)}>`,
        to: opts.to,
        subject: 'Activate your Magnify account',
        html,
        text,
        headers: { 'X-Mailer': 'Magnify' },
      });
      this.logger.log(
        `[Mail] SENT ${label}\n` +
          `  to        : ${opts.to}\n` +
          `  messageId : ${messageId || 'n/a'}`,
      );
    } catch (err) {
      this.logSendError(err, label);
      throw err;
    }
  }

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

  // Sends an order summary to the admin inbox after a customer places an order.
  // Non-throwing: order placement must succeed even if this notification fails.
  async sendOrderPlacedAdminNotification(order: {
    orderId: string;
    customerName: string;
    email: string;
    phone?: string;
    qty: number;
    totalValue: number;
    subtotal: number;
    deliveryFee: number;
    paymentMethod?: string;
    paymentSlipUrl?: string;
    shippingAddress?: string;
    district?: string;
    items?: {
      name?: string;
      price?: number;
      quantity?: number;
      frameType?: string;
      colorOption?: string;
    }[];
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.adminAddress) {
      this.logger.warn(
        `[Mail] Order #${order.orderId} placed — admin notification skipped (ADMIN_EMAIL/CONTACT_EMAIL not set)`,
      );
      return { success: false, error: 'Admin email not configured' };
    }
    if (!this.fromAddress) {
      this.logger.warn(
        `[Mail] Order #${order.orderId} placed — admin notification skipped (from address not ready)`,
      );
      return { success: false, error: 'Resend from address not ready' };
    }

    const money = (n: number) =>
      `LKR ${Number(n || 0).toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const safeName = escapeHtml(order.customerName);
    const safeOrderId = escapeHtml(order.orderId);
    const safeEmail = escapeHtml(order.email);
    const safePhone = order.phone ? escapeHtml(order.phone) : '—';
    const safeAddress = order.shippingAddress
      ? escapeHtml(order.shippingAddress)
      : '—';
    const safeDistrict = order.district ? escapeHtml(order.district) : '—';

    const items = order.items ?? [];
    const itemRowsHtml = items.length
      ? items
          .map((it) => {
            const name = escapeHtml(it.name || 'Item');
            const variant = [it.frameType, it.colorOption]
              .filter(Boolean)
              .map((v) => escapeHtml(String(v)))
              .join(' / ');
            const qty = Number(it.quantity || 0);
            const price = Number(it.price || 0);
            return `<tr>
                <td style="padding:6px 12px;color:#434652;border-bottom:1px solid #EEF1F5">${name}${
                  variant ? ` <span style="color:#9CA3AF">(${variant})</span>` : ''
                }</td>
                <td style="padding:6px 12px;color:#434652;border-bottom:1px solid #EEF1F5;text-align:center">${qty}</td>
                <td style="padding:6px 12px;color:#434652;border-bottom:1px solid #EEF1F5;text-align:right">${money(price)}</td>
                <td style="padding:6px 12px;color:#434652;border-bottom:1px solid #EEF1F5;text-align:right">${money(price * qty)}</td>
              </tr>`;
          })
          .join('')
      : `<tr><td colspan="4" style="padding:6px 12px;color:#9CA3AF">No item details provided</td></tr>`;

    const itemsText = items.length
      ? items
          .map((it) => {
            const variant = [it.frameType, it.colorOption]
              .filter(Boolean)
              .join(' / ');
            const qty = Number(it.quantity || 0);
            const price = Number(it.price || 0);
            return `  - ${it.name || 'Item'}${variant ? ` (${variant})` : ''} x${qty} @ ${money(
              price,
            )} = ${money(price * qty)}`;
          })
          .join('\n')
      : '  (No item details provided)';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px">
        <h2 style="color:#002B73;margin-bottom:8px">New Order Placed — #${safeOrderId}</h2>
        <p style="color:#434652">A new order has been placed on Magnify.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Order ID</td><td style="padding:6px 12px;color:#434652">#${safeOrderId}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Customer</td><td style="padding:6px 12px;color:#434652">${safeName}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Email</td><td style="padding:6px 12px;color:#434652">${safeEmail}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Phone</td><td style="padding:6px 12px;color:#434652">${safePhone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Shipping Address</td><td style="padding:6px 12px;color:#434652">${safeAddress}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">District</td><td style="padding:6px 12px;color:#434652">${safeDistrict}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Total Items</td><td style="padding:6px 12px;color:#434652">${Number(order.qty || 0)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Payment Method</td><td style="padding:6px 12px;color:#434652">${escapeHtml(order.paymentMethod || '—')}</td></tr>${
            order.paymentSlipUrl && /^https?:\/\//i.test(order.paymentSlipUrl)
              ? `
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Bank Slip</td><td style="padding:6px 12px"><a href="${escapeHtml(order.paymentSlipUrl)}" style="color:#15479C">View uploaded receipt</a></td></tr>`
              : ''
          }
        </table>
        <h3 style="color:#002B73;margin-bottom:4px">Items</h3>
        <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
          <thead>
            <tr>
              <th style="padding:6px 12px;text-align:left;color:#002B73;border-bottom:2px solid #002B73">Product</th>
              <th style="padding:6px 12px;text-align:center;color:#002B73;border-bottom:2px solid #002B73">Qty</th>
              <th style="padding:6px 12px;text-align:right;color:#002B73;border-bottom:2px solid #002B73">Price</th>
              <th style="padding:6px 12px;text-align:right;color:#002B73;border-bottom:2px solid #002B73">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRowsHtml}</tbody>
        </table>
        <table style="border-collapse:collapse;margin-left:auto;margin-top:16px">
          <tr><td style="padding:4px 12px;color:#434652">Subtotal</td><td style="padding:4px 12px;text-align:right">${money(order.subtotal)}</td></tr>
          <tr><td style="padding:4px 12px;color:#434652">Delivery Fee</td><td style="padding:4px 12px;text-align:right">${order.deliveryFee ? money(order.deliveryFee) : 'Free'}</td></tr>
          <tr><td style="padding:6px 12px;font-size:20px;font-weight:bold;color:#BC0000">Order Total</td><td style="padding:6px 12px;font-size:20px;font-weight:bold;color:#BC0000;text-align:right">${money(order.totalValue)}</td></tr>
        </table>
      </div>
    `;

    const text =
      `New order placed on Magnify.\n\n` +
      `Order ID: #${order.orderId}\n` +
      `Customer: ${order.customerName}\n` +
      `Email: ${order.email}\n` +
      `Phone: ${order.phone || '—'}\n` +
      `Shipping Address: ${order.shippingAddress || '—'}\n` +
      `District: ${order.district || '—'}\n` +
      `Total Items: ${Number(order.qty || 0)}\n\n` +
      `Items:\n${itemsText}\n\n` +
      `Subtotal: ${money(order.subtotal)}\n` +
      `Delivery Fee: ${order.deliveryFee ? money(order.deliveryFee) : 'Free'}\n` +
      `Order Total: ${money(order.totalValue)}`;

    const label = `admin order #${order.orderId} → ${this.adminAddress}`;
    try {
      const messageId = await this.sendWithResend({
        from: `Magnify Orders <${this.stripName(this.fromAddress)}>`,
        to: this.adminAddress,
        subject: `New Order #${order.orderId} — ${order.customerName}`,
        html,
        text,
        replyTo: order.email,
        headers: {
          'X-Mailer': 'Magnify',
        },
      });
      this.logger.log(
        `[Mail] SENT ${label}\n` +
          `  to          : ${this.adminAddress}\n` +
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

  // Accepts either "email@x.com" or "Name <email@x.com>" and returns the raw
  // address portion, so we can safely re-wrap it with a display name.
  private stripName(address: string): string {
    const match = address.match(/<([^>]+)>/);
    return (match ? match[1] : address).trim();
  }
}
