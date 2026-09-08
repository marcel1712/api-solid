import { prisma } from "@/lib/prisma";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { PrismaPetImageRepository } from "@/repositories/prisma/prisma-pet-image-repository";
import { DeletePetImageUseCase } from "../deletePetImageUseCase";

export function makeDeletePetImageUseCase() {
  const petRepository = new PrismaPetRepository(prisma);
  const petImageRepository = new PrismaPetImageRepository(prisma);
  return new DeletePetImageUseCase(petRepository, petImageRepository);
}
