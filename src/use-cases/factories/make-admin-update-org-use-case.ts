import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { AdminUpdateOrgUseCase } from "../adminUpdateOrgUseCase";
import { makeSendEmailVerificationUseCase } from "./make-send-email-verification-use-case";

export function makeAdminUpdateOrgUseCase() {
  return new AdminUpdateOrgUseCase(
    new PrismaOrgRepository(prisma),
    makeSendEmailVerificationUseCase(),
  );
}
