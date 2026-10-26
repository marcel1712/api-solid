import { OrgDocument, PrismaClient } from "@prisma/client";
import {
  OrgDocumentRepository,
  SaveOrgDocumentData,
} from "@/repositories/org-document-repository";

export class PrismaOrgDocumentRepository implements OrgDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByOrgId(orgId: string): Promise<OrgDocument[]> {
    return this.prisma.orgDocument.findMany({ where: { orgId } });
  }

  async save(data: SaveOrgDocumentData): Promise<OrgDocument> {
    return this.prisma.orgDocument.upsert({
      where: { orgId_kind: { orgId: data.orgId, kind: data.kind } },
      create: data,
      update: { key: data.key, created_at: new Date() },
    });
  }

  async deleteManyByOrgId(orgId: string): Promise<void> {
    await this.prisma.orgDocument.deleteMany({ where: { orgId } });
  }
}
