import { randomUUID } from "node:crypto";
import { EmailVerificationToken } from "@prisma/client";
import {
  CreateEmailVerificationTokenData,
  EmailVerificationTokenRepository,
} from "@/repositories/email-verification-token-repository";

export class InMemoryEmailVerificationTokenRepository
  implements EmailVerificationTokenRepository
{
  public items: EmailVerificationToken[] = [];

  async create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationToken> {
    const token: EmailVerificationToken = {
      id: randomUUID(),
      orgId: data.orgId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      usedAt: null,
      created_at: new Date(),
    };

    this.items.push(token);

    return token;
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    return this.items.find((item) => item.tokenHash === tokenHash) ?? null;
  }

  async markUsed(id: string): Promise<void> {
    const token = this.items.find((item) => item.id === id);
    if (token) {
      token.usedAt = new Date();
    }
  }

  async deleteManyByOrgId(orgId: string): Promise<void> {
    this.items = this.items.filter((item) => item.orgId !== orgId);
  }
}
