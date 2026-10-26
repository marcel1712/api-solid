import { Session } from "@prisma/client";
import { SessionRepository } from "@/repositories/session-repository";
import { CreateSessionUseCase } from "@/use-cases/createSessionUseCase";
import { InvalidSessionError } from "@/use-cases/errors/invalid-session-error";
import { hashToken } from "@/utils/hash-token";

// Two tabs booting at the same time both send the same cookie. The first one
// rotates it; the second arrives a moment later with the token that was just
// replaced. Inside this window that's treated as a race, not as theft — the
// browser already holds the new cookie from the first response.
export const REUSE_GRACE_PERIOD_MS = 30 * 1000;

interface RefreshSessionRequest {
  refreshToken: string;
}

interface RefreshSessionResponse {
  orgId: string;
  /** `null` when the request fell in the grace period and the cookie stays as is. */
  refreshToken: string | null;
}

export class RefreshSessionUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(
    request: RefreshSessionRequest,
  ): Promise<RefreshSessionResponse> {
    const session = await this.sessionRepository.findByTokenHash(
      hashToken(request.refreshToken),
    );

    if (!session || session.expiresAt < new Date()) {
      throw new InvalidSessionError();
    }

    if (session.revokedAt !== null) {
      if (await this.isConcurrentRefresh(session)) {
        return { orgId: session.orgId, refreshToken: null };
      }

      // Signed out, or reset away: the token is simply dead.
      if (session.replacedById === null) {
        throw new InvalidSessionError();
      }

      // A rotated token showing up again means two parties hold it — one of
      // them stole it. There's no telling which, so every session goes.
      await this.sessionRepository.revokeAllByOrgId(session.orgId);
      throw new InvalidSessionError();
    }

    const { sessionId, refreshToken } = await new CreateSessionUseCase(
      this.sessionRepository,
    ).execute({ orgId: session.orgId });

    await this.sessionRepository.markReplaced(session.id, sessionId);

    return { orgId: session.orgId, refreshToken };
  }

  // Only a token that was rotated — not one signed out or revoked by a password
  // reset — and whose replacement is still alive gets the benefit of the doubt.
  private async isConcurrentRefresh(session: Session): Promise<boolean> {
    if (session.replacedById === null || session.revokedAt === null) {
      return false;
    }

    if (Date.now() - session.revokedAt.getTime() > REUSE_GRACE_PERIOD_MS) {
      return false;
    }

    const replacement = await this.sessionRepository.findById(
      session.replacedById,
    );
    return replacement !== null && replacement.revokedAt === null;
  }
}
