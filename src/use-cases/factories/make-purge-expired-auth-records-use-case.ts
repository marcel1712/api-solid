import { prisma } from "@/lib/prisma";
import { PrismaSessionRepository } from "@/repositories/prisma/prisma-session-repository";
import { PrismaEmailVerificationTokenRepository } from "@/repositories/prisma/prisma-email-verification-token-repository";
import { PrismaPasswordResetTokenRepository } from "@/repositories/prisma/prisma-password-reset-token-repository";
import { PurgeExpiredAuthRecordsUseCase } from "../purgeExpiredAuthRecordsUseCase";

export function makePurgeExpiredAuthRecordsUseCase() {
  return new PurgeExpiredAuthRecordsUseCase(
    new PrismaSessionRepository(prisma),
    new PrismaEmailVerificationTokenRepository(prisma),
    new PrismaPasswordResetTokenRepository(prisma),
  );
}
