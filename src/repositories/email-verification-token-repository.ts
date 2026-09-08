import { EmailVerificationToken } from "@prisma/client";

export interface CreateEmailVerificationTokenData {
  orgId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface EmailVerificationTokenRepository {
  create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationToken>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  markUsed(id: string): Promise<void>;
  deleteManyByOrgId(orgId: string): Promise<void>;
}
