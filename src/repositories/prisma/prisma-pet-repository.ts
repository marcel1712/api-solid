import { AnimalSize, AnimalType, Org, Pet, Prisma, PrismaClient } from "@prisma/client";
import { PetRepository } from "@/repositories/pet-repository";

export class PrismaPetRepository implements PetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.PetCreateInput): Promise<Pet> {
    return this.prisma.pet.create({ data });
  }

  async findById(id: string): Promise<Pet | null> {
    return this.prisma.pet.findUnique({ where: { id } });
  }

  async findManyByOrgIds(
    orgs: Org[],
    filters: { age?: number; size?: AnimalSize; type?: AnimalType },
  ): Promise<Pet[]> {
    const orgsIds = orgs.map((org) => org.id);

    return this.prisma.pet.findMany({
      where: {
        orgId: { in: orgsIds },
        age: filters.age,
        size: filters.size,
        type: filters.type,
      },
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
}
