import { PetRepository } from "@/repositories/pet-repository";
import { Pet } from "@prisma/client";

interface GetPetDetailsRequest {
  petId: string;
}

export class GetPetDetailsUseCase {
  constructor(private petRepository: PetRepository) {}

  async execute(request: GetPetDetailsRequest): Promise<Pet> {
    const pet = await this.petRepository.findById(request.petId);
    if (!pet) {
      throw new Error("This pet doesnt exist");
    }
    return pet;
  }
}
