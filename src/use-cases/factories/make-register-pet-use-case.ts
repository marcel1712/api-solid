import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { RegisterPetUseCase } from "../registerPet";
import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";

export function makeRegisterPetUseCase() {
  const petRepository = new PrismaPetRepository(prisma);
  const orgRepository = new PrismaOrgRepository(prisma);
  const registerPetUseCase = new RegisterPetUseCase(
    petRepository,
    orgRepository,
  );

  return registerPetUseCase;
}
