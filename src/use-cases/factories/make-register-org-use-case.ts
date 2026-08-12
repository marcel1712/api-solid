import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { RegisterOrgUseCase } from "../registerOrg";

export function makeRegisterOrgUseCase() {
  const orgsRepository = new PrismaOrgRepository(prisma);
  const registerOrgUseCase = new RegisterOrgUseCase(orgsRepository);

  return registerOrgUseCase;
}
