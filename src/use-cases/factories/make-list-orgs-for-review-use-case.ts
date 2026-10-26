import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaOrgDocumentRepository } from "@/repositories/prisma/prisma-org-document-repository";
import { R2DocumentStorage } from "@/lib/document-storage";
import { ListOrgsForReviewUseCase } from "../listOrgsForReviewUseCase";

export function makeListOrgsForReviewUseCase() {
  return new ListOrgsForReviewUseCase(
    new PrismaOrgRepository(prisma),
    new PrismaOrgDocumentRepository(prisma),
    new R2DocumentStorage(),
  );
}
