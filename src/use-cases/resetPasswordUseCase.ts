import { hash } from "bcrypt";
import { OrgRepository } from "@/repositories/org-repository";
import { PasswordResetTokenRepository } from "@/repositories/password-reset-token-repository";
import { InvalidOrExpiredTokenError } from "@/use-cases/errors/invalid-or-expired-token-error";
import { hashToken } from "@/utils/hash-token";

interface ResetPasswordRequest {
  token: string;
  password: string;
}

export class ResetPasswordUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(request: ResetPasswordRequest): Promise<void> {
    const tokenHash = hashToken(request.token);
    const resetToken =
      await this.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < new Date()
    ) {
      throw new InvalidOrExpiredTokenError();
    }

    const password_hash = await hash(request.password, 10);

    await this.orgRepository.updatePassword(resetToken.orgId, password_hash);
    await this.passwordResetTokenRepository.markUsed(resetToken.id);
  }
}
