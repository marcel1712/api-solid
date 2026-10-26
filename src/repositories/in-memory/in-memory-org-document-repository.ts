import { randomUUID } from "node:crypto";
import { OrgDocument } from "@prisma/client";
import {
  OrgDocumentRepository,
  SaveOrgDocumentData,
} from "@/repositories/org-document-repository";

export class InMemoryOrgDocumentRepository implements OrgDocumentRepository {
  public items: OrgDocument[] = [];

  async findManyByOrgId(orgId: string): Promise<OrgDocument[]> {
    return this.items.filter((item) => item.orgId === orgId);
  }

  async save(data: SaveOrgDocumentData): Promise<OrgDocument> {
    const existing = this.items.find(
      (item) => item.orgId === data.orgId && item.kind === data.kind,
    );

    if (existing) {
      existing.key = data.key;
      existing.created_at = new Date();
      return existing;
    }

    const document: OrgDocument = {
      id: randomUUID(),
      ...data,
      created_at: new Date(),
    };
    this.items.push(document);
    return document;
  }

  async deleteManyByOrgId(orgId: string): Promise<void> {
    this.items = this.items.filter((item) => item.orgId !== orgId);
  }
}
