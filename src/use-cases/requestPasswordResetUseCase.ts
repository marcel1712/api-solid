import { randomBytes } from "node:crypto";
import { OrgRepository } from "@/repositories/org-repository";
import { PasswordResetTokenRepository } from "@/repositories/password-reset-token-repository";
import { Mailer } from "@/lib/mailer";
import { hashToken } from "@/utils/hash-token";
import env from "@/env/env";

const TOKEN_EXPIRES_IN_MS = 60 * 60 * 1000;

interface RequestPasswordResetRequest {
  email: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private passwordResetTokenRepository: PasswordResetTokenRepository,
    private mailer: Mailer,
  ) {}

  async execute(request: RequestPasswordResetRequest): Promise<void> {
    const org = await this.orgRepository.findByEmail(request.email);

    if (!org) {
      return;
    }

    await this.passwordResetTokenRepository.deleteManyByOrgId(org.id);

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_IN_MS);

    await this.passwordResetTokenRepository.create({
      orgId: org.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailer.sendPasswordResetEmail({ to: org.email, resetUrl });
  }
}
