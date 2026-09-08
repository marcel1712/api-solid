import { randomBytes } from "node:crypto";
import { EmailVerificationTokenRepository } from "@/repositories/email-verification-token-repository";
import { Mailer } from "@/lib/mailer";
import { hashToken } from "@/utils/hash-token";
import env from "@/env/env";

const TOKEN_EXPIRES_IN_MS = 24 * 60 * 60 * 1000;

interface SendEmailVerificationRequest {
  orgId: string;
  email: string;
}

export class SendEmailVerificationUseCase {
  constructor(
    private emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private mailer: Mailer,
  ) {}

  async execute(request: SendEmailVerificationRequest): Promise<void> {
    await this.emailVerificationTokenRepository.deleteManyByOrgId(
      request.orgId,
    );

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_IN_MS);

    await this.emailVerificationTokenRepository.create({
      orgId: request.orgId,
      tokenHash,
      expiresAt,
    });

    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.mailer.sendVerificationEmail({ to: request.email, verifyUrl });
  }
}
