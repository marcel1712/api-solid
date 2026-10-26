import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaOrgDocumentRepository } from "@/repositories/prisma/prisma-org-document-repository";
import { GetOwnOrgUseCase } from "../getOwnOrgUseCase";

export function makeGetOwnOrgUseCase() {
  return new GetOwnOrgUseCase(
    new PrismaOrgRepository(prisma),
    new PrismaOrgDocumentRepository(prisma),
  );
}
