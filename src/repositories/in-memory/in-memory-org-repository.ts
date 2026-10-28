import { OrgRepository, UpdateOrgData } from "@/repositories/org-repository";
import { Org, OrgStatus, Prisma } from "@prisma/client";
import { OrgReview } from "@/repositories/org-repository";
import { CnpjCheck } from "@/utils/cnpj-check";
import { randomUUID } from "node:crypto";

export class InMemoryOrgRepository implements OrgRepository {
  public items: Org[] = [];

  async findByEmail(email: string) {
    const org = this.items.find((item) => item.email === email);

    if (!org) {
      return null;
    } else {
      return org;
    }
  }

  async findById(id: string) {
    const org = this.items.find((item) => item.id === id);

    if (!org) {
      return null;
    } else {
      return org;
    }
  }

  async findManyApprovedByCity(city: string): Promise<Org[]> {
    return this.items.filter(
      (org) => org.city === city && org.status === OrgStatus.Approved,
    );
  }

  async findManyByStatus(status: OrgStatus): Promise<Org[]> {
    return this.items.filter((org) => org.status === status);
  }

  async findByCnpj(cnpj: string): Promise<Org | null> {
    return this.items.find((org) => org.cnpj === cnpj) ?? null;
  }

  async updateStatus(id: string, status: OrgStatus): Promise<void> {
    const org = await this.findById(id);
    if (org) org.status = status;
  }

  async saveReview(id: string, review: OrgReview): Promise<void> {
    const org = await this.findById(id);
    if (org) Object.assign(org, review);
  }

  async saveCnpjCheck(id: string, check: CnpjCheck): Promise<void> {
    const org = await this.findById(id);
    if (org) org.cnpjCheck = check as unknown as Prisma.JsonValue;
  }

  async update(id: string, data: UpdateOrgData): Promise<Org | null> {
    const org = await this.findById(id);
    if (!org) {
      return null;
    }

    if (data.name !== undefined) org.name = data.name;
    if (data.whatsapp !== undefined) org.whatsapp = data.whatsapp;
    if (data.city !== undefined) org.city = data.city;
    if (data.address !== undefined) org.address = data.address;

    return org;
  }

  async updatePassword(id: string, password_hash: string): Promise<void> {
    const org = await this.findById(id);
    if (!org) {
      return;
    }

    org.password_hash = password_hash;
  }

  async markEmailAsVerified(id: string): Promise<void> {
    const org = await this.findById(id);
    if (!org) {
      return;
    }

    org.emailVerifiedAt = new Date();
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
  }

  async create(data: Prisma.OrgCreateInput) {
    const org: Org = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      password_hash: data.password_hash,
      whatsapp: data.whatsapp,
      city: data.city,
      address: data.address,
      created_at: new Date(),
      emailVerifiedAt: null,
      cnpj: data.cnpj ?? null,
      status: data.status ?? OrgStatus.Pending,
      cnpjCheck: (data.cnpjCheck as Prisma.JsonValue | undefined) ?? null,
      rejectionReason: null,
      reviewedAt: null,
      termsVersion: data.termsVersion ?? null,
      termsAcceptedAt: (data.termsAcceptedAt as Date | undefined) ?? null,
    };

    this.items.push(org);

    return org;
  }
}
