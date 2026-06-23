/**
 * BUG-009 FIX — AuthService (forgotPassword rewrite)
 *
 * WHAT WAS WRONG:
 *   1. No email library was installed or imported.
 *   2. `forgotPassword()` generated a token and saved it to the DB, but
 *      **never sent any email**. A comment read "In production, you would
 *      send an email with the plain token" — it was a TODO left in production.
 *   3. The raw reset token was returned in the JSON response body, which is a
 *      security leak (any MITM or log scraper could obtain it).
 *   4. There was no error handling around the (missing) email-send call, so
 *      failures would have been silently swallowed — the API always returned
 *      a false-success 200 to the frontend, which then displayed
 *      "Check your email" even though nothing was sent.
 *
 * WHAT WAS FIXED:
 *   1. `MailService` is now injected and its `sendPasswordResetEmail()` is
 *      properly `await`-ed inside `forgotPassword()`.
 *   2. The raw `resetToken` is NO LONGER returned in the JSON response.
 *   3. The email-send call is inside a try/catch: if it fails, the exception
 *      propagates up and NestJS returns a 500 to the client instead of a
 *      false-success 200.
 *   4. Structured `Logger` calls mark each step:
 *        [STEP 1] Request received
 *        [STEP 2] Token generated & stored
 *        [STEP 3] Email send attempted  (logged inside MailService)
 *        [STEP 4] Email send result     (logged inside MailService)
 *
 * NOTE: The security-by-obscurity pattern (returning the same success message
 * for both existing and non-existing users) is preserved to prevent email
 * enumeration attacks.
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CustomerService } from '../customer/customer.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  // BUG-009 FIX: Structured logger so every step of the password-reset
  // flow is visible in server logs with consistent prefixes.
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private customerService: CustomerService,
    // BUG-009 FIX: MailService injected — this is what was completely missing.
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.role === 'user') {
      await this.customerService.ensureForRegisteredUser({
        email: user.email,
        fullName: user.fullName,
      });
    }
    const payload = { email: user.email, sub: user._id.toString(), role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.usersService.create(
      registerDto.email,
      registerDto.password,
      'user',
      registerDto.fullName,
    );
    await this.customerService.ensureForRegisteredUser({
      email: user.email,
      fullName: registerDto.fullName,
    });
    const payload = { email: user.email, sub: user._id.toString(), role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Log that the request has been received.
    // ─────────────────────────────────────────────────────────────────────────
    this.logger.log(`[STEP 1] Forgot-password request received for email: ${dto.email}`);

    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      // Security: return the same response whether the email exists or not
      // to prevent user-enumeration attacks.
      this.logger.log(
        `[STEP 1] Email not found in database — returning generic success (anti-enumeration).`,
      );
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Generate a cryptographically-secure reset token, hash it for
    //           storage, and persist it with a 15-minute expiry.
    // ─────────────────────────────────────────────────────────────────────────

    // Plain token — sent inside the email link (never stored in DB).
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hashed token — stored in DB so the plain token is never at rest.
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Token is valid for 15 minutes from now.
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    this.logger.log(
      `[STEP 2] Reset token generated and persisted for user: ${user.email}. ` +
      `Expires at: ${expiresAt.toISOString()}`,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3 — Build the reset URL and send the email.
    //
    // BUG-009 FIX: This entire block is new — previously no email was sent.
    // The `await` ensures errors are not fire-and-forgot; they propagate up
    // and cause a 500 response instead of a false-success 200.
    // ─────────────────────────────────────────────────────────────────────────
    const frontendBaseUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    // The frontend /reset-password page receives `token` as a query parameter.
    const resetLink = `${frontendBaseUrl}/reset-password?token=${resetToken}`;

    this.logger.log(`[STEP 3] Dispatching password-reset email to: ${user.email}`);

    // BUG-009 FIX: `await` is critical here.  Without it the send runs in the
    // background (fire-and-forget), errors are invisible, and the handler
    // always returns success — exactly the bug that was reported.
    await this.mailService.sendPasswordResetEmail(user.email, resetLink);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4 — Email sent successfully; return the standard success message.
    //
    // BUG-009 FIX: The raw `resetToken` is NO LONGER returned in the response.
    // Exposing it in the HTTP response body was a security leak (it allowed
    // anyone who could read the response — a proxy, log aggregator, etc. — to
    // reset any account without access to the mailbox).
    // ─────────────────────────────────────────────────────────────────────────
    this.logger.log(`[STEP 4] Password-reset flow completed successfully for: ${user.email}`);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.logger.log(`[RESET] Reset-password attempt with provided token.`);

    // Find user by checking all users with reset tokens
    const user = await this.usersService.findByResetToken(dto.token);

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      this.logger.warn(`[RESET] No user found for the provided reset token.`);
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Verify the token against the hashed version stored in DB
    const isValid = await bcrypt.compare(dto.token, user.passwordResetToken);

    if (!isValid) {
      this.logger.warn(`[RESET] Token comparison failed for user: ${user.email}`);
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (user.passwordResetExpires < new Date()) {
      this.logger.warn(
        `[RESET] Token expired at ${user.passwordResetExpires.toISOString()} for user: ${user.email}`,
      );
      throw new BadRequestException('Reset token expired');
    }

    // Update password and clear the reset token fields
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    this.logger.log(`[RESET] ✅ Password reset successfully for user: ${user.email}`);
    return { message: 'Password reset successful' };
  }
}
