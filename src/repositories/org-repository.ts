import { Prisma, Org, OrgStatus } from "@prisma/client";
import { CnpjCheck } from "@/utils/cnpj-check";

export interface UpdateOrgData {
  name?: string;
  whatsapp?: string;
  city?: string;
  address?: string;
}

export interface OrgReview {
  status: OrgStatus;
  rejectionReason: string | null;
  reviewedAt: Date;
}

export interface OrgRepository {
  /** Only approved orgs: the others' pets stay off public pages. */
  findManyApprovedByCity(city: string): Promise<Org[]>;
  findManyByStatus(status: OrgStatus): Promise<Org[]>;
  findByEmail(email: string): Promise<Org | null>;
  findByCnpj(cnpj: string): Promise<Org | null>;
  findById(id: string): Promise<Org | null>;
  create(data: Prisma.OrgCreateInput): Promise<Org>;
  update(id: string, data: UpdateOrgData): Promise<Org | null>;
  updatePassword(id: string, password_hash: string): Promise<void>;
  markEmailAsVerified(id: string): Promise<void>;
  updateStatus(id: string, status: OrgStatus): Promise<void>;
  saveReview(id: string, review: OrgReview): Promise<void>;
  saveCnpjCheck(id: string, check: CnpjCheck): Promise<void>;
  delete(id: string): Promise<void>;
}
