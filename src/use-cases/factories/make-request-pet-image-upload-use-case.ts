import { prisma } from "@/lib/prisma";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { PrismaPetImageRepository } from "@/repositories/prisma/prisma-pet-image-repository";
import { RequestPetImageUploadUseCase } from "../requestPetImageUploadUseCase";

export function makeRequestPetImageUploadUseCase() {
  const petRepository = new PrismaPetRepository(prisma);
  const petImageRepository = new PrismaPetImageRepository(prisma);
  return new RequestPetImageUploadUseCase(petRepository, petImageRepository);
}
