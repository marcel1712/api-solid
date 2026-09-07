import { prisma } from "@/lib/prisma";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { UpdatePetUseCase } from "../updatePetUseCase";

export function makeUpdatePetUseCase() {
  const petRepository = new PrismaPetRepository(prisma);
  return new UpdatePetUseCase(petRepository);
}
