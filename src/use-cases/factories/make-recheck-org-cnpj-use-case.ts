import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { BrasilApiCnpjLookup } from "@/lib/cnpj-lookup";
import { RecheckOrgCnpjUseCase } from "../recheckOrgCnpjUseCase";

export function makeRecheckOrgCnpjUseCase() {
  return new RecheckOrgCnpjUseCase(
    new PrismaOrgRepository(prisma),
    new BrasilApiCnpjLookup(),
  );
}
