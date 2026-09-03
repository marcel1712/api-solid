import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { FetchPetByCityUseCase } from "../fetchPetsByCityUseCase";
import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";

export function makeFetchPetByCityUseCase(){
    const petRepository = new PrismaPetRepository(prisma);
    const orgRepository = new PrismaOrgRepository(prisma)
    const fetchPetByCityUseCase = new FetchPetByCityUseCase(petRepository, orgRepository);
    return fetchPetByCityUseCase
}