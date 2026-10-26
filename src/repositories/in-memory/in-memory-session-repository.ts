import { randomUUID } from "node:crypto";
import { Session } from "@prisma/client";
import {
  CreateSessionData,
  SessionRepository,
} from "@/repositories/session-repository";

export class InMemorySessionRepository implements SessionRepository {
  public items: Session[] = [];

  async create(data: CreateSessionData): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      orgId: data.orgId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      revokedAt: null,
      replacedById: null,
      created_at: new Date(),
    };

    this.items.push(session);

    return session;
  }

  async findById(id: string): Promise<Session | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    return this.items.find((item) => item.tokenHash === tokenHash) ?? null;
  }

  async revoke(id: string): Promise<void> {
    const session = this.items.find((item) => item.id === id);
    if (session) {
      session.revokedAt = new Date();
    }
  }

  async markReplaced(id: string, replacedById: string): Promise<void> {
    const session = this.items.find((item) => item.id === id);
    if (session) {
      session.revokedAt = new Date();
      session.replacedById = replacedById;
    }
  }

  async revokeAllByOrgId(orgId: string): Promise<void> {
    for (const session of this.items) {
      if (session.orgId === orgId && session.revokedAt === null) {
        session.revokedAt = new Date();
      }
    }
  }
}
