import { Org, OrgStatus, Prisma } from "@prisma/client";
import { OrgCreateInput } from "../../../generated/prisma/models";
import {
  OrgRepository,
  OrgReview,
  UpdateOrgData,
} from "@/repositories/org-repository";
import { CnpjCheck } from "@/utils/cnpj-check";
import { PrismaClient } from "@/../generated/prisma/client";
import { ResourceAlreadyExistsError } from "@/use-cases/errors/resource-already-exists-error";

// Email and WhatsApp are unique columns. Checking first and inserting after
// leaves a gap two requests can slip through, so the constraint itself is the
// final word — and its violation is a conflict, not a server failure.
function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export class PrismaOrgRepository implements OrgRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: OrgCreateInput): Promise<Org> {
    try {
      return await this.prisma.org.create({ data });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ResourceAlreadyExistsError(
          "This email, WhatsApp or CNPJ is already registered",
        );
      }
      throw error;
    }
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

  async findManyApprovedByCity(city: string): Promise<Org[]> {
    return this.prisma.org.findMany({
      where: {
        city,
        status: OrgStatus.Approved,
      },
    });
  }

  async findManyByStatus(status: OrgStatus): Promise<Org[]> {
    return this.prisma.org.findMany({
      where: { status },
      orderBy: { created_at: "asc" },
    });
  }

  async findByCnpj(cnpj: string): Promise<Org | null> {
    return this.prisma.org.findUnique({ where: { cnpj } });
  }

  async updateStatus(id: string, status: OrgStatus): Promise<void> {
    await this.prisma.org.update({ where: { id }, data: { status } });
  }

  async saveReview(id: string, review: OrgReview): Promise<void> {
    await this.prisma.org.update({ where: { id }, data: review });
  }

  async saveCnpjCheck(id: string, check: CnpjCheck): Promise<void> {
    await this.prisma.org.update({
      where: { id },
      data: { cnpjCheck: check as unknown as Prisma.InputJsonValue },
    });
  }

  async update(id: string, data: UpdateOrgData): Promise<Org | null> {
    try {
      return await this.prisma.org.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      if (isUniqueViolation(error)) {
        throw new ResourceAlreadyExistsError(
          "This WhatsApp is already registered",
        );
      }
      throw error;
    }
  }

  async updatePassword(id: string, password_hash: string): Promise<void> {
    await this.prisma.org.update({
      where: { id },
      data: { password_hash },
    });
  }

  async markEmailAsVerified(id: string): Promise<void> {
    await this.prisma.org.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
    });
  }
}
