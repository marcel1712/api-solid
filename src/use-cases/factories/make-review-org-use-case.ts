import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaOrgDocumentRepository } from "@/repositories/prisma/prisma-org-document-repository";
import { R2DocumentStorage } from "@/lib/document-storage";
import { ReviewOrgUseCase } from "../reviewOrgUseCase";

export function makeReviewOrgUseCase() {
  return new ReviewOrgUseCase(
    new PrismaOrgRepository(prisma),
    new PrismaOrgDocumentRepository(prisma),
    new R2DocumentStorage(),
  );
}
