import { EmailVerificationToken, PrismaClient } from "@prisma/client";
import {
  CreateEmailVerificationTokenData,
  EmailVerificationTokenRepository,
} from "@/repositories/email-verification-token-repository";

export class PrismaEmailVerificationTokenRepository
  implements EmailVerificationTokenRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationToken> {
    return this.prisma.emailVerificationToken.create({ data });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteManyByOrgId(orgId: string): Promise<void> {
    await this.prisma.emailVerificationToken.deleteMany({ where: { orgId } });
  }
}
