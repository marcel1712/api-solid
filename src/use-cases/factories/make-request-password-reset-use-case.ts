import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaPasswordResetTokenRepository } from "@/repositories/prisma/prisma-password-reset-token-repository";
import { ResendMailer } from "@/lib/resend-mailer";
import { RequestPasswordResetUseCase } from "../requestPasswordResetUseCase";

export function makeRequestPasswordResetUseCase() {
  const orgRepository = new PrismaOrgRepository(prisma);
  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(
    prisma,
  );
  const mailer = new ResendMailer();
  return new RequestPasswordResetUseCase(
    orgRepository,
    passwordResetTokenRepository,
    mailer,
  );
}
