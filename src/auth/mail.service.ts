
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromAddress = this.configService.get<string>('RESEND_FROM') || '';
    this.resend = new Resend(apiKey || '');

    if (!apiKey || !this.fromAddress) {
      this.logger.warn(
        'Resend configuration is incomplete. Set RESEND_API_KEY and RESEND_FROM in your environment.',
      );
    }

    this.logger.log(
      `MailService initialised — Resend from: ${this.fromAddress || 'NOT SET'}`,
    );
  }

  /**
   * Send a password-reset email to the given address.
   *
   * @param to        Recipient email address (the registered user's address)
   * @param resetLink Full URL that the user should click to reset their password
   */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    this.logger.log(`[STEP 3] Attempting to send password-reset email to: ${to}`);

    if (!this.fromAddress) {
      throw new InternalServerErrorException(
        'Could not send the password-reset email. Please try again later.',
      );
    }

    const mailOptions = {
      from: this.fromAddress,
      to,
      subject: 'Reset Your Magnify Password',
      text: `You requested a password reset.\n\nClick the link below to set a new password (valid for 15 minutes):\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.`,
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

    try {
      const result = await this.resend.emails.send(mailOptions);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send password-reset email');
      }

      this.logger.log(
        `[STEP 4] ✅ Password-reset email delivered successfully. ` +
          `MessageId: ${result.data?.id ?? 'n/a'}, To: ${to}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[STEP 4] ❌ Failed to send password-reset email to: ${to} using Resend. ` +
          `Error: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'Could not send the password-reset email. Please try again later.',
      );
    }
  }
}
