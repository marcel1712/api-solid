import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { prisma } from "@/lib/prisma";
import { ResendEmailVerificationUseCase } from "../resendEmailVerificationUseCase";
import { makeSendEmailVerificationUseCase } from "./make-send-email-verification-use-case";

export function makeResendEmailVerificationUseCase() {
  const orgRepository = new PrismaOrgRepository(prisma);
  const sendEmailVerificationUseCase = makeSendEmailVerificationUseCase();
  return new ResendEmailVerificationUseCase(
    orgRepository,
    sendEmailVerificationUseCase,
  );
}
