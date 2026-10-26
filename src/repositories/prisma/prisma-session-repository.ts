import { PrismaClient, Session } from "@prisma/client";
import {
  CreateSessionData,
  SessionRepository,
} from "@/repositories/session-repository";

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateSessionData): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { tokenHash } });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async markReplaced(id: string, replacedById: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date(), replacedById },
    });
  }

  async revokeAllByOrgId(orgId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { orgId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
