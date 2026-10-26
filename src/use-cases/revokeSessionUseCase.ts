import { SessionRepository } from "@/repositories/session-repository";
import { hashToken } from "@/utils/hash-token";

interface RevokeSessionRequest {
  refreshToken: string;
}

export class RevokeSessionUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  // Idempotent: signing out with an unknown or already revoked token is not an
  // error, the outcome the client wants (no live session) already holds.
  async execute(request: RevokeSessionRequest): Promise<void> {
    const session = await this.sessionRepository.findByTokenHash(
      hashToken(request.refreshToken),
    );

    if (!session || session.revokedAt !== null) {
      return;
    }

    await this.sessionRepository.revoke(session.id);
  }
}
