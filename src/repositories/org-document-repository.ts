import { OrgDocument, OrgDocumentKind } from "@prisma/client";

export interface SaveOrgDocumentData {
  orgId: string;
  kind: OrgDocumentKind;
  key: string;
}

export interface OrgDocumentRepository {
  findManyByOrgId(orgId: string): Promise<OrgDocument[]>;
  /** One file per kind: saving a kind again replaces the previous one. */
  save(data: SaveOrgDocumentData): Promise<OrgDocument>;
  deleteManyByOrgId(orgId: string): Promise<void>;
}
