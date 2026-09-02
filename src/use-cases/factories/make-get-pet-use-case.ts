import { prisma } from "@/lib/prisma";
import { GetPetDetailsUseCase } from "../getPetDetailsUseCase";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";



export const makeGetPetUseCase = () => {
    const petRepository = new PrismaPetRepository(prisma);
    const getPetDetailsUseCase = new GetPetDetailsUseCase(petRepository);

    return getPetDetailsUseCase;
}