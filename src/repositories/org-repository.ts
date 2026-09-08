import { Prisma, Org } from "@prisma/client";

export interface UpdateOrgData {
  name?: string;
  whatsapp?: string;
  city?: string;
  address?: string;
}

export interface OrgRepository {
  findManyByCity(city: string): Promise<Org[]>;
  findByEmail(email: string): Promise<Org | null>;
  findById(id: string): Promise<Org | null>;
  create(data: Prisma.OrgCreateInput): Promise<Org>;
  update(id: string, data: UpdateOrgData): Promise<Org | null>;
  updatePassword(id: string, password_hash: string): Promise<void>;
}
