import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    this.from =
      this.config.get<string>('EMAIL_FROM')?.trim() ||
      'Graveyard <onboarding@resend.dev>';
    this.resend = apiKey ? new Resend(apiKey) : null;

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is not set — emails will be logged only',
      );
    }
  }

  async sendVerificationEmail(params: {
    to: string;
    name: string;
    verifyUrl: string;
  }): Promise<void> {
    const { to, name, verifyUrl } = params;
    const firstName = this.firstName(name);
    const subject = 'Verify your Graveyard email';
    const html = `
      <p>Hi ${firstName},</p>
      <p>Confirm your email to submit work on Graveyard.</p>
      <p><a href="${verifyUrl}">Verify email</a></p>
      <p>This link expires in 48 hours. If you did not create an account, you can ignore this email.</p>
      <p>— Graveyard</p>
    `;

    await this.send({ to, subject, html, devLabel: 'Verification', url: verifyUrl });
  }

  async sendPasswordResetEmail(params: {
    to: string;
    name: string;
    resetUrl: string;
  }): Promise<void> {
    const { to, name, resetUrl } = params;
    const firstName = this.firstName(name);
    const subject = 'Reset your Graveyard password';
    const html = `
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your Graveyard password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in a short time. If you did not request a reset, you can ignore this email.</p>
      <p>— Graveyard</p>
    `;

    await this.send({ to, subject, html, devLabel: 'Password reset', url: resetUrl });
  }

  private firstName(name: string) {
    const part = name.trim().split(/\s+/)[0];
    return part || 'there';
  }

  private async send(params: {
    to: string;
    subject: string;
    html: string;
    devLabel: string;
    url: string;
  }): Promise<void> {
    const { to, subject, html, devLabel, url } = params;

    if (!this.resend) {
      this.logger.log(`[dev] ${devLabel} for ${to}: ${url}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send ${devLabel.toLowerCase()} email to ${to}`, error);
      throw new Error(`Failed to send ${devLabel.toLowerCase()} email`);
    }
  }
}
