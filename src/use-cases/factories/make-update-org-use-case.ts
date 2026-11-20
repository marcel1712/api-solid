import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { UpdateOrgUseCase } from "../updateOrgUseCase";
import { ResendMailer } from "@/lib/resend-mailer";

export function makeUpdateOrgUseCase() {
  const orgRepository = new PrismaOrgRepository(prisma);
  return new UpdateOrgUseCase(orgRepository, new ResendMailer());
}
