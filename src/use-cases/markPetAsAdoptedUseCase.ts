import { Pet } from "@prisma/client";
import { PetRepository } from "@/repositories/pet-repository";

interface MarkPetAsAdoptedRequest {
  petId: string;
  adopted: boolean;
}


export class MarkPetAsAdoptedUseCase {
  constructor(private petRepository: PetRepository) {}

  async execute(
    request: MarkPetAsAdoptedRequest,
  ): Promise<Pet> {
    const pet = await this.petRepository.updateAdoptionStatus(
      request.petId,
      request.adopted,
    );
    if (!pet) {
      throw new Error("This pet doesnt exist");
    }

    return pet;
  }
}
