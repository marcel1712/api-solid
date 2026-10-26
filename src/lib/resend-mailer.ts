import { Resend } from "resend";
import { Mailer } from "@/lib/mailer";
import {
  EmailContent,
  orgApprovedEmail,
  orgRejectedEmail,
  passwordResetEmail,
  verificationEmail,
} from "@/lib/email-templates";
import env from "@/env/env";

export class ResendMailer implements Mailer {
  private resend = new Resend(env.RESEND_API_KEY);

  // The SDK doesn't throw on a refused send (bad key, unverified domain,
  // quota): it resolves with `{ error }`. Unchecked, every failed email
  // looked like a success.
  private async send(to: string, content: EmailContent) {
    const { error } = await this.resend.emails.send({
      from: env.MAIL_FROM,
      to,
      ...content,
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
    await this.send(to, passwordResetEmail(resetUrl));
  }

  async sendVerificationEmail({
    to,
    verifyUrl,
  }: {
    to: string;
    verifyUrl: string;
  }): Promise<void> {
    await this.send(to, verificationEmail(verifyUrl));
  }

  async sendOrgApprovedEmail({
    to,
    orgName,
    dashboardUrl,
  }: {
    to: string;
    orgName: string;
    dashboardUrl: string;
  }): Promise<void> {
    await this.send(to, orgApprovedEmail(orgName, dashboardUrl));
  }

  async sendOrgRejectedEmail({
    to,
    orgName,
    reason,
    dashboardUrl,
  }: {
    to: string;
    orgName: string;
    reason: string;
    dashboardUrl: string;
  }): Promise<void> {
    await this.send(to, orgRejectedEmail(orgName, reason, dashboardUrl));
  }
}
