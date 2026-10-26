import { Resend } from "resend";
import { Mailer } from "@/lib/mailer";
import env from "@/env/env";

export class ResendMailer implements Mailer {
  private resend = new Resend(env.RESEND_API_KEY);

  // The SDK doesn't throw on a refused send (bad key, unverified domain,
  // quota): it resolves with `{ error }`. Unchecked, every failed email
  // looked like a success.
  private async send(email: { to: string; subject: string; html: string }) {
    const { error } = await this.resend.emails.send({
      from: env.MAIL_FROM,
      ...email,
    });

    if (error) {
      throw new Error(`Resend refused the email: ${error.name}: ${error.message}`);
    }
  }

  async sendPasswordResetEmail({
    to,
    resetUrl,
  }: {
    to: string;
    resetUrl: string;
  }): Promise<void> {
    await this.send({
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
    await this.send({
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
