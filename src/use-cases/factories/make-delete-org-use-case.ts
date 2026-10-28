import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaOrgDocumentRepository } from "@/repositories/prisma/prisma-org-document-repository";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { PrismaPetImageRepository } from "@/repositories/prisma/prisma-pet-image-repository";
import { PrismaSessionRepository } from "@/repositories/prisma/prisma-session-repository";
import { PrismaPasswordResetTokenRepository } from "@/repositories/prisma/prisma-password-reset-token-repository";
import { PrismaEmailVerificationTokenRepository } from "@/repositories/prisma/prisma-email-verification-token-repository";
import { PrismaBlockedContactRepository } from "@/repositories/prisma/prisma-blocked-contact-repository";
import { R2DocumentStorage } from "@/lib/document-storage";
import { DeleteOrgUseCase } from "../deleteOrgUseCase";

export function makeDeleteOrgUseCase() {
  return new DeleteOrgUseCase(
    new PrismaOrgRepository(prisma),
    new PrismaOrgDocumentRepository(prisma),
    new PrismaPetRepository(prisma),
    new PrismaPetImageRepository(prisma),
    new PrismaSessionRepository(prisma),
    new PrismaPasswordResetTokenRepository(prisma),
    new PrismaEmailVerificationTokenRepository(prisma),
    new PrismaBlockedContactRepository(prisma),
    new R2DocumentStorage(),
  );
}
