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
}
