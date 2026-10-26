import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { BrasilApiCnpjLookup } from "@/lib/cnpj-lookup";
import { RegisterOrgUseCase } from "../registerOrg";

export function makeRegisterOrgUseCase() {
  const orgsRepository = new PrismaOrgRepository(prisma);
  const registerOrgUseCase = new RegisterOrgUseCase(
    orgsRepository,
    new BrasilApiCnpjLookup(),
  );

  return registerOrgUseCase;
}
