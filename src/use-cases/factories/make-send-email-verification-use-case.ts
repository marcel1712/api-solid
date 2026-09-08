import { prisma } from "@/lib/prisma";
import { PrismaEmailVerificationTokenRepository } from "@/repositories/prisma/prisma-email-verification-token-repository";
import { ResendMailer } from "@/lib/resend-mailer";
import { SendEmailVerificationUseCase } from "../sendEmailVerificationUseCase";

export function makeSendEmailVerificationUseCase() {
  const emailVerificationTokenRepository =
    new PrismaEmailVerificationTokenRepository(prisma);
  const mailer = new ResendMailer();
  return new SendEmailVerificationUseCase(
    emailVerificationTokenRepository,
    mailer,
  );
}
