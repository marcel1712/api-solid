import { prisma } from "@/lib/prisma";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { PrismaPetImageRepository } from "@/repositories/prisma/prisma-pet-image-repository";
import { ConfirmPetImageUploadUseCase } from "../confirmPetImageUploadUseCase";

export function makeConfirmPetImageUploadUseCase() {
  const petRepository = new PrismaPetRepository(prisma);
  const petImageRepository = new PrismaPetImageRepository(prisma);
  return new ConfirmPetImageUploadUseCase(petRepository, petImageRepository);
}
