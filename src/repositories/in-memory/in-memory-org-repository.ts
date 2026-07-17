import { OrgRepository } from "../org-repository";
import { Org, Prisma } from "@prisma/client";
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

  async create(data: Prisma.OrgCreateInput) {
    const org = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      password_hash: data.password_hash,
      whatsapp: data.whatsapp,
      city: data.city,
      address: data.address,
      created_at: new Date(),
    };

    this.items.push(org);

    return org;
  }
}
