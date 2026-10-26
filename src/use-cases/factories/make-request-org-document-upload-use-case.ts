import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { R2DocumentStorage } from "@/lib/document-storage";
import { RequestOrgDocumentUploadUseCase } from "../requestOrgDocumentUploadUseCase";

export function makeRequestOrgDocumentUploadUseCase() {
  return new RequestOrgDocumentUploadUseCase(
    new PrismaOrgRepository(prisma),
    new R2DocumentStorage(),
  );
}
