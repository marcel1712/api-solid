import { Pet } from "@prisma/client";
import { PetRepository } from "@/repositories/pet-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";

interface MarkPetAsAdoptedRequest {
  petId: string;
  orgId: string;
  adopted: boolean;
}


export class MarkPetAsAdoptedUseCase {
  constructor(private petRepository: PetRepository) {}

  async execute(
    request: MarkPetAsAdoptedRequest,
  ): Promise<Pet> {
    const pet = await this.petRepository.findById(request.petId);

    if (!pet) {
      throw new ResourceNotFoundError();
    }

    if (pet.orgId !== request.orgId) {
      throw new NotAllowedError();
    }

    const updatedPet = await this.petRepository.updateAdoptionStatus(
      request.petId,
      request.adopted,
    );

    return updatedPet as Pet;
  }
}
