import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaPasswordResetTokenRepository } from "@/repositories/prisma/prisma-password-reset-token-repository";
import { ResetPasswordUseCase } from "../resetPasswordUseCase";

export function makeResetPasswordUseCase() {
  const orgRepository = new PrismaOrgRepository(prisma);
  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(
    prisma,
  );
  return new ResetPasswordUseCase(orgRepository, passwordResetTokenRepository);
}
