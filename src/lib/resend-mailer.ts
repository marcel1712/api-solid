import { Resend } from "resend";
import { Mailer } from "@/lib/mailer";
import env from "@/env/env";

export class ResendMailer implements Mailer {
  private resend = new Resend(env.RESEND_API_KEY);

  async sendPasswordResetEmail({
    to,
    resetUrl,
  }: {
    to: string;
    resetUrl: string;
  }): Promise<void> {
    await this.resend.emails.send({
      from: env.MAIL_FROM,
      to,
      subject: "Reset your FindAFriend password",
      html: `
        <p>We received a request to reset your FindAFriend password.</p>
        <p><a href="${resetUrl}">Click here to choose a new password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }

  async sendVerificationEmail({
    to,
    verifyUrl,
  }: {
    to: string;
    verifyUrl: string;
  }): Promise<void> {
    await this.resend.emails.send({
      from: env.MAIL_FROM,
      to,
      subject: "Confirm your FindAFriend email",
      html: `
        <p>Welcome to FindAFriend! Please confirm your email address to activate your account.</p>
        <p><a href="${verifyUrl}">Click here to confirm your email</a></p>
        <p>This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
      `,
    });
  }
}
