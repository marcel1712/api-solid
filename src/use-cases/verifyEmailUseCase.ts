import { OrgRepository } from "@/repositories/org-repository";
import { EmailVerificationTokenRepository } from "@/repositories/email-verification-token-repository";
import { InvalidOrExpiredTokenError } from "@/use-cases/errors/invalid-or-expired-token-error";
import { hashToken } from "@/utils/hash-token";

interface VerifyEmailRequest {
  token: string;
}

export class VerifyEmailUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private emailVerificationTokenRepository: EmailVerificationTokenRepository,
  ) {}

  async execute(request: VerifyEmailRequest): Promise<void> {
    const tokenHash = hashToken(request.token);
    const verificationToken =
      await this.emailVerificationTokenRepository.findByTokenHash(tokenHash);

    if (
      !verificationToken ||
      verificationToken.usedAt !== null ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new InvalidOrExpiredTokenError();
    }

    await this.orgRepository.markEmailAsVerified(verificationToken.orgId);
    await this.emailVerificationTokenRepository.markUsed(verificationToken.id);
  }
}
