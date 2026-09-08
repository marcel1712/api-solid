import { prisma } from "@/lib/prisma";
import { GetPetDetailsUseCase } from "../getPetDetailsUseCase";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaPetImageRepository } from "@/repositories/prisma/prisma-pet-image-repository";

export const makeGetPetUseCase = () => {
    const petRepository = new PrismaPetRepository(prisma);
    const orgRepository = new PrismaOrgRepository(prisma);
    const petImageRepository = new PrismaPetImageRepository(prisma);
    const getPetDetailsUseCase = new GetPetDetailsUseCase(petRepository, orgRepository, petImageRepository);
    return getPetDetailsUseCase;
}