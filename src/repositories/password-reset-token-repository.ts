import { PasswordResetToken } from "@prisma/client";

export interface CreatePasswordResetTokenData {
  orgId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface PasswordResetTokenRepository {
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string): Promise<void>;
  deleteManyByOrgId(orgId: string): Promise<void>;
}
