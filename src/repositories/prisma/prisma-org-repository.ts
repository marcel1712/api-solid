import { Org } from "@prisma/client";
import { OrgCreateInput } from "../../../generated/prisma/models";
import { OrgRepository } from "@/repositories/org-repository";
import { PrismaClient } from "@/../generated/prisma/client";
import { Prisma } from "@prisma/client";

export class PrismaOrgRepository implements OrgRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: OrgCreateInput): Promise<Org> {
    return this.prisma.org.create({ data });
  }

  async findByEmail(email: string): Promise<Org | null> {
    return this.prisma.org.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id: string): Promise<Org | null> {
    return this.prisma.org.findUnique({
      where: {
        id,
      },
    });
  }

  async findManyByCity(city: string): Promise<Org[]> {
    return this.prisma.org.findMany({
      where: {
        city,
      },
    });
  }
}
