import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaOrgDocumentRepository } from "@/repositories/prisma/prisma-org-document-repository";
import { R2DocumentStorage } from "@/lib/document-storage";
import { ConfirmOrgDocumentUploadUseCase } from "../confirmOrgDocumentUploadUseCase";

export function makeConfirmOrgDocumentUploadUseCase() {
  return new ConfirmOrgDocumentUploadUseCase(
    new PrismaOrgRepository(prisma),
    new PrismaOrgDocumentRepository(prisma),
    new R2DocumentStorage(),
  );
}
