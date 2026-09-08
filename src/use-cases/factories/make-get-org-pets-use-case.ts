import { prisma } from "@/lib/prisma";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { PrismaPetImageRepository } from "@/repositories/prisma/prisma-pet-image-repository";
import { GetOrgPetsUseCase } from "../getOrgPetsUseCase";

export function makeGetOrgPetsUseCase() {
  const petRepository = new PrismaPetRepository(prisma);
  const petImageRepository = new PrismaPetImageRepository(prisma);
  return new GetOrgPetsUseCase(petRepository, petImageRepository);
}
