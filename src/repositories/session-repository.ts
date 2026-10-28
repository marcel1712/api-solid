import { Session } from "@prisma/client";

export interface CreateSessionData {
  orgId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface SessionRepository {
  create(data: CreateSessionData): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  revoke(id: string): Promise<void>;
  markReplaced(id: string, replacedById: string): Promise<void>;
  revokeAllByOrgId(orgId: string): Promise<void>;
  /** Removes sessions that expired before `date`; returns how many. */
  deleteExpiredBefore(date: Date): Promise<number>;
  deleteManyByOrgId(orgId: string): Promise<void>;
}
