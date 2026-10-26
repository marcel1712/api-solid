import { randomBytes } from "node:crypto";
import { SessionRepository } from "@/repositories/session-repository";
import { hashToken } from "@/utils/hash-token";

export const SESSION_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

interface CreateSessionRequest {
  orgId: string;
}

interface CreateSessionResponse {
  sessionId: string;
  refreshToken: string;
}

export class CreateSessionUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const refreshToken = randomBytes(32).toString("hex");

    const session = await this.sessionRepository.create({
      orgId: request.orgId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + SESSION_EXPIRES_IN_MS),
    });

    return { sessionId: session.id, refreshToken };
  }
}
