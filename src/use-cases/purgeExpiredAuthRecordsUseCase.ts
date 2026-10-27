import { SessionRepository } from "@/repositories/session-repository";
import { EmailVerificationTokenRepository } from "@/repositories/email-verification-token-repository";
import { PasswordResetTokenRepository } from "@/repositories/password-reset-token-repository";

/**
 * Email links stay a day past their expiry: clicking an already used link
 * again (or a mail scanner prefetching it) still finds the row and answers as
 * before. After that, nobody can use them anymore.
 */
export const EMAIL_TOKEN_GRACE_MS = 24 * 60 * 60 * 1000;

interface PurgeExpiredAuthRecordsResponse {
  sessions: number;
  emailVerificationTokens: number;
  passwordResetTokens: number;
}

/**
 * Every login and every refresh adds a session row, and nothing else ever
 * removes them. Only what's past its expiry goes: a rotated-but-unexpired
 * session must stay, because it's what reveals a stolen token being reused.
 */
export class PurgeExpiredAuthRecordsUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(now = new Date()): Promise<PurgeExpiredAuthRecordsResponse> {
    const emailCutoff = new Date(now.getTime() - EMAIL_TOKEN_GRACE_MS);

    return {
      sessions: await this.sessionRepository.deleteExpiredBefore(now),
      emailVerificationTokens:
        await this.emailVerificationTokenRepository.deleteExpiredBefore(
          emailCutoff,
        ),
      passwordResetTokens:
        await this.passwordResetTokenRepository.deleteExpiredBefore(emailCutoff),
    };
  }
}
