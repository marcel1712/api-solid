import { AnimalSize, AnimalType, Org, Pet, Prisma, PrismaClient } from "@prisma/client";
import { PetRepository, UpdatePetData } from "@/repositories/pet-repository";

export class PrismaPetRepository implements PetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.PetCreateInput): Promise<Pet> {
    return this.prisma.pet.create({ data });
  }

  async findById(id: string): Promise<Pet | null> {
    return this.prisma.pet.findUnique({ where: { id } });
  }

  async findManyByOrgId(orgId: string, page: number): Promise<Pet[]> {
    const PAGE_SIZE = 20;

    return this.prisma.pet.findMany({
      where: { orgId },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  }

  async findManyByOrgIds(
    orgs: Org[],
    page: number,
    filters: {
      ageMin?: number;
      ageMax?: number;
      size?: AnimalSize;
      type?: AnimalType;
    },
  ): Promise<Pet[]> {
    const orgsIds = orgs.map((org) => org.id);
    const PAGE_SIZE = 20;

    return this.prisma.pet.findMany({
      where: {
        orgId: { in: orgsIds },
        adopted: false,
        age: {
          gte: filters.ageMin,
          lte: filters.ageMax,
        },
        size: filters.size,
        type: filters.type,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  }

  async updateAdoptionStatus(
    id: string,
    adopted: boolean,
  ): Promise<Pet | null> {
    try {
      return await this.prisma.pet.update({
        where: { id },
        data: { adopted },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  async update(id: string, data: UpdatePetData): Promise<Pet | null> {
    try {
      return await this.prisma.pet.update({
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
      throw error;
    }
  }
}
