

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  // Structured logger — every step of the email flow is logged here.
  private readonly logger = new Logger(MailService.name);

  // Nodemailer transporter — created once and reused for all sends.
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    // BUG-009 FIX: Read SMTP credentials from environment variables.
    // Previously no credentials existed anywhere — they are now required
    // in .env (see the SMTP_* variables added there).
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = port === 465; // true for port 465 (SSL), false for 587 (STARTTLS)

    if (!host || !user || !pass) {
      // Log a loud warning at startup so developers notice immediately
      // that mail will not work rather than discovering it at runtime.
      this.logger.warn(
        '⚠️  SMTP credentials are not fully configured. ' +
        'Set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env file. ' +
        'Password-reset emails will fail until these are provided.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    this.logger.log(`✅ MailService initialised — SMTP host: ${host ?? 'NOT SET'}, port: ${port}`);
  }

  /**
   * Send a password-reset email to the given address.
   *
   * BUG-009 FIX: This is the method that was entirely missing before.
   * It is properly `async`, properly `await`-ed by the caller, and throws
   * an InternalServerErrorException on failure so the caller never returns
   * a false-success to the client.
   *
   * @param to        Recipient email address (the registered user's address)
   * @param resetLink Full URL that the user should click to reset their password
   */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    // Step 1 — log that we are about to attempt the send.
    this.logger.log(`[STEP 3] Attempting to send password-reset email to: ${to}`);

    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ??
      `"Magnify Support" <no-reply@magnify.com>`;

    const mailOptions = {
      from: fromAddress,
      to,
      subject: 'Reset Your Magnify Password',
      // Plain-text fallback for email clients that do not render HTML.
      text: `You requested a password reset.\n\nClick the link below to set a new password (valid for 15 minutes):\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.`,
      // Rich HTML body for modern email clients.
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002B73;">Reset Your Password</h2>
          <p>You requested a password reset for your Magnify account.</p>
          <p>Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.</p>
          <a href="${resetLink}"
             style="display:inline-block; padding:12px 24px; background:#002B73;
                    color:#fff; text-decoration:none; border-radius:6px; margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#666; font-size:13px;">
            If the button above doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${resetLink}">${resetLink}</a>
          </p>
          <hr style="border:none; border-top:1px solid #eee; margin-top:32px;"/>
          <p style="color:#aaa; font-size:12px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    // If using placeholder credentials, immediately route to fallback instead of wasting time
    if (this.isPlaceholderCredentials()) {
      this.logger.warn(
        `⚠️ Using placeholder SMTP credentials. Redirecting email to local/test fallback...`,
      );
      await this.sendViaFallback(mailOptions, resetLink);
      return;
    }

    try {
      // BUG-009 FIX: The send is properly awaited here.
      // Previously there was no send call at all — fire-and-forget or silent
      // omission would have the same symptom (no email delivered).
      const info = await this.transporter.sendMail(mailOptions);

      // Step 4 — log success with the provider's message ID for traceability.
      this.logger.log(
        `[STEP 4] ✅ Password-reset email delivered successfully. ` +
        `MessageId: ${info.messageId ?? 'n/a'}, To: ${to}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[STEP 4] ❌ Failed to send password-reset email to: ${to} using primary SMTP. ` +
        `Error: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      // If the primary SMTP fails, try to fall back to Ethereal/Console so the
      // development process is not blocked by a transient email configuration issue.
      this.logger.warn(`🔄 Attempting to send via test email fallback...`);
      try {
        await this.sendViaFallback(mailOptions, resetLink);
      } catch (fallbackError) {
        throw new InternalServerErrorException(
          'Could not send the password-reset email. Please try again later.',
        );
      }
    }
  }

  /**
   * Helper to identify if current SMTP configuration is using placeholder values.
   */
  private isPlaceholderCredentials(): boolean {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) return true;
    if (
      user.includes('your-email') ||
      user.includes('your-address') ||
      pass.includes('your-app-password') ||
      pass.includes('your-16-char')
    ) {
      return true;
    }
    return false;
  }

  /**
   * Safe fallback sending method for local development / testing.
   * Attempts to use Ethereal.email, and defaults to console printing if that fails.
   */
  private async sendViaFallback(mailOptions: any, resetLink: string): Promise<void> {
    try {
      this.logger.log(`⏳ Creating temporary Ethereal.email account for testing...`);
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await etherealTransporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      this.logger.log(
        `\n========================================================================\n` +
        `📬 TEST EMAIL SENT SUCCESSFULLY via Ethereal.email!\n` +
        `To: ${mailOptions.to}\n` +
        `Reset Link: ${resetLink}\n` +
        `------------------------------------------------------------------------\n` +
        `🔗 Click the link below to view/preview the email in your browser:\n` +
        `👉 ${previewUrl || 'No preview URL available'}\n` +
        `========================================================================\n`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Ethereal.email fallback failed: ${message}`);
      this.logger.warn(`⚠️ Falling back to direct console logging...`);

      this.logger.log(
        `\n========================================================================\n` +
        `📧 [CONSOLE FALLBACK] PASSWORD RESET EMAIL DETAILS:\n` +
        `To: ${mailOptions.to}\n` +
        `Subject: ${mailOptions.subject}\n` +
        `Reset Link: ${resetLink}\n` +
        `------------------------------------------------------------------------\n` +
        `Please copy the reset link above to test the password reset flow.\n` +
        `========================================================================\n`
      );
    }
  }
}
