import { PasswordResetToken, PrismaClient } from "@prisma/client";
import {
  CreatePasswordResetTokenData,
  PasswordResetTokenRepository,
} from "@/repositories/password-reset-token-repository";

export class PrismaPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: CreatePasswordResetTokenData,
  ): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({ data });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteManyByOrgId(orgId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({ where: { orgId } });
  }
}
