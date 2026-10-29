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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.logger = new common_1.Logger(MailService_1.name);
        const apiKey = (config.get('RESEND_API_KEY') || '').trim();
        this.fromAddress = (config.get('RESEND_FROM_EMAIL') || '').trim();
        this.adminAddress = (config.get('ADMIN_EMAIL') ||
            config.get('CONTACT_EMAIL') ||
            '').trim();
        this.resend = new resend_1.Resend(apiKey || 're_email_disabled');
        if (!apiKey || !this.fromAddress) {
            this.logger.warn('[Mail] Resend config incomplete (need RESEND_API_KEY / RESEND_FROM_EMAIL) — email disabled');
        }
    }
    async onModuleInit() {
        if (this.fromAddress) {
            this.logger.log(`[Mail] Resend ready | from: ${this.fromAddress}`);
        }
    }
    logSendError(err, label) {
        this.logger.error(`[Mail] FAILED ${label}\n` +
            `  message     : ${err instanceof Error ? err.message : String(err)}`);
    }
    async sendWithResend(options) {
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
    async sendActivationEmail(opts) {
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
        const text = `Hi ${opts.fullName?.trim() || 'there'},\n\n` +
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
            this.logger.log(`[Mail] SENT ${label}\n` +
                `  to        : ${opts.to}\n` +
                `  messageId : ${messageId || 'n/a'}`);
        }
        catch (err) {
            this.logSendError(err, label);
            throw err;
        }
    }
    async sendMail(options) {
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
            this.logger.log(`[Mail] SENT ${label}\n` +
                `  to          : ${options.to}\n` +
                `  messageId   : ${messageId || 'n/a'}`);
        }
        catch (err) {
            this.logSendError(err, label);
            throw err;
        }
    }
    async sendOrderStatusUpdate(opts) {
        if (!this.fromAddress) {
            this.logger.warn(`[Mail] Order #${opts.orderId} — skipped (from address not ready)`);
            return { success: false, error: 'Resend from address not ready' };
        }
        const statusLabel = opts.newStatus.charAt(0).toUpperCase() +
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
        <p style="color:#434652;margin-top:24px">Thank you for shopping with Magnify.</p>
        <hr style="border:none;border-top:1px solid #EEF1F5;margin:24px 0"/>
        <p style="font-size:12px;color:#9CA3AF">
          Questions about your order? Reply to this email and we will get back to you.
        </p>
      </div>
    `;
        const text = `Dear ${opts.customerName},\n\n` +
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
            this.logger.log(`[Mail] SENT ${label}\n` +
                `  to          : ${opts.to}\n` +
                `  messageId   : ${messageId || 'n/a'}`);
            return { success: true };
        }
        catch (err) {
            this.logSendError(err, label);
            return {
                success: false,
                error: err instanceof Error ? err.message : String(err),
            };
        }
    }
    async sendOrderPlacedAdminNotification(order) {
        if (!this.adminAddress) {
            this.logger.warn(`[Mail] Order #${order.orderId} placed — admin notification skipped (ADMIN_EMAIL/CONTACT_EMAIL not set)`);
            return { success: false, error: 'Admin email not configured' };
        }
        if (!this.fromAddress) {
            this.logger.warn(`[Mail] Order #${order.orderId} placed — admin notification skipped (from address not ready)`);
            return { success: false, error: 'Resend from address not ready' };
        }
        const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', {
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
                <td style="padding:6px 12px;color:#434652;border-bottom:1px solid #EEF1F5">${name}${variant ? ` <span style="color:#9CA3AF">(${variant})</span>` : ''}</td>
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
                return `  - ${it.name || 'Item'}${variant ? ` (${variant})` : ''} x${qty} @ ${money(price)} = ${money(price * qty)}`;
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
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Payment Method</td><td style="padding:6px 12px;color:#434652">${escapeHtml(order.paymentMethod || '—')}</td></tr>${order.paymentSlipUrl && /^https?:\/\//i.test(order.paymentSlipUrl)
            ? `
          <tr><td style="padding:6px 12px;font-weight:bold;color:#002B73;white-space:nowrap">Bank Slip</td><td style="padding:6px 12px"><a href="${escapeHtml(order.paymentSlipUrl)}" style="color:#15479C">View uploaded receipt</a></td></tr>`
            : ''}
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
        const text = `New order placed on Magnify.\n\n` +
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
            this.logger.log(`[Mail] SENT ${label}\n` +
                `  to          : ${this.adminAddress}\n` +
                `  messageId   : ${messageId || 'n/a'}`);
            return { success: true };
        }
        catch (err) {
            this.logSendError(err, label);
            return {
                success: false,
                error: err instanceof Error ? err.message : String(err),
            };
        }
    }
    stripName(address) {
        const match = address.match(/<([^>]+)>/);
        return (match ? match[1] : address).trim();
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map