import { OrgRepository } from "@/repositories/org-repository";
import { PetRepository } from "@/repositories/pet-repository";
import { Pet } from "@prisma/client";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetPetDetailsRequest {
  petId: string;
}
interface GetPetDetailsResponse{
  pet: Pet;
  whatsapp: string;
}

export class GetPetDetailsUseCase {
  constructor(private petRepository: PetRepository, private orgRepository: OrgRepository) {}

  async execute(request: GetPetDetailsRequest): Promise<GetPetDetailsResponse> {

    const pet = await this.petRepository.findById(request.petId);

    if (!pet) {
      throw new ResourceNotFoundError();
    }

    const org = await this.orgRepository.findById(pet.orgId);

    if (!org) {
      throw new ResourceNotFoundError();
    }

    return { pet, whatsapp: org.whatsapp };
  }
}
