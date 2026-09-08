import { randomUUID } from "node:crypto";
import { PasswordResetToken } from "@prisma/client";
import {
  CreatePasswordResetTokenData,
  PasswordResetTokenRepository,
} from "@/repositories/password-reset-token-repository";

export class InMemoryPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  public items: PasswordResetToken[] = [];

  async create(
    data: CreatePasswordResetTokenData,
  ): Promise<PasswordResetToken> {
    const token: PasswordResetToken = {
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
  ): Promise<PasswordResetToken | null> {
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
