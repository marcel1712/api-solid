import { AnimalSize, AnimalType, Pet } from "@prisma/client";
import { PetRepository } from "@/repositories/pet-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";

interface UpdatePetRequest {
  petId: string;
  orgId: string;
  name?: string;
  age?: number;
  size?: AnimalSize;
  type?: AnimalType;
  bio?: string;
}

export class UpdatePetUseCase {
  constructor(private petRepository: PetRepository) {}

  async execute(request: UpdatePetRequest): Promise<Pet> {
    const pet = await this.petRepository.findById(request.petId);

    if (!pet) {
      throw new ResourceNotFoundError();
    }

    if (pet.orgId !== request.orgId) {
      throw new NotAllowedError();
    }

    const updatedPet = await this.petRepository.update(request.petId, {
      name: request.name,
      age: request.age,
      size: request.size,
      type: request.type,
      bio: request.bio,
    });

    return updatedPet as Pet;
  }
}
