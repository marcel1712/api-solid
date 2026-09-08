import { PetImage, PrismaClient } from "@prisma/client";
import {
  CreatePetImageData,
  PetImageRepository,
} from "@/repositories/pet-image-repository";

export class PrismaPetImageRepository implements PetImageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePetImageData): Promise<PetImage> {
    return this.prisma.petImage.create({ data });
  }

  async findById(id: string): Promise<PetImage | null> {
    return this.prisma.petImage.findUnique({ where: { id } });
  }

  async findManyByPetId(petId: string): Promise<PetImage[]> {
    return this.prisma.petImage.findMany({ where: { petId } });
  }

  async findManyByPetIds(petIds: string[]): Promise<PetImage[]> {
    return this.prisma.petImage.findMany({
      where: { petId: { in: petIds } },
    });
  }

  async countByPetId(petId: string): Promise<number> {
    return this.prisma.petImage.count({ where: { petId } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.petImage.delete({ where: { id } });
  }
}
