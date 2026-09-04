import { prisma } from "@/lib/prisma";
import { PrismaPetRepository } from "@/repositories/prisma/prisma-pet-repository";
import { MarkPetAsAdoptedUseCase } from "../markPetAsAdoptedUseCase";

export async function makeMarkPetAsAdoptedUseCase() {
    const petRepository = new PrismaPetRepository(prisma);
    const markPetAsAdoptedUseCase = new MarkPetAsAdoptedUseCase(petRepository);

    return markPetAsAdoptedUseCase;
}