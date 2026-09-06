import { prisma } from "@/lib/prisma";
import { GetPetDetailsUseCase } from "../getPetDetailsUseCase";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";



export const makeGetPetUseCase = () => {
    const petRepository = new PrismaPetRepository(prisma);
    const orgRepository = new PrismaOrgRepository(prisma);
    const getPetDetailsUseCase = new GetPetDetailsUseCase(petRepository, orgRepository);
    return getPetDetailsUseCase;
}