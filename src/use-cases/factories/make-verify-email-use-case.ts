import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaEmailVerificationTokenRepository } from "@/repositories/prisma/prisma-email-verification-token-repository";
import { VerifyEmailUseCase } from "../verifyEmailUseCase";

export function makeVerifyEmailUseCase() {
  const orgRepository = new PrismaOrgRepository(prisma);
  const emailVerificationTokenRepository =
    new PrismaEmailVerificationTokenRepository(prisma);
  return new VerifyEmailUseCase(orgRepository, emailVerificationTokenRepository);
}
