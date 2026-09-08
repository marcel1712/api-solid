import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { FetchPetByCityUseCase } from "../fetchPetsByCityUseCase";
import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { PrismaPetImageRepository } from "@/repositories/prisma/prisma-pet-image-repository";

export function makeFetchPetByCityUseCase(){
    const petRepository = new PrismaPetRepository(prisma);
    const orgRepository = new PrismaOrgRepository(prisma)
    const petImageRepository = new PrismaPetImageRepository(prisma);
    const fetchPetByCityUseCase = new FetchPetByCityUseCase(petRepository, orgRepository, petImageRepository);
    return fetchPetByCityUseCase
}