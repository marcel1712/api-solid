import { Pet, Org, AnimalSize, AnimalType } from "@prisma/client";
import { PetRepository } from "@/repositories/pet-repository";
import { OrgRepository } from "@/repositories/org-repository";

interface RegisterPetRequest {
  name: string;
  orgId: string;
  age: number;
  size: AnimalSize;
  type: AnimalType;
  bio?: string;
}

interface RegisterPetResponse {
  pet: Pet;
}

export class RegisterPetUseCase {
  constructor(
    private petRepository: PetRepository,
    private orgRepository: OrgRepository,
  ) {}

  async execute(request: RegisterPetRequest): Promise<RegisterPetResponse> {
    const org = await this.orgRepository.findById(request.orgId);
    if (!org) {
      throw new Error("This org doesnt exist");
    }

    const pet: Pet = await this.petRepository.create({
      name: request.name,
      age: request.age,
      size: request.size,
      type: request.type,
      bio: request.bio || null,
      org: { connect: { id: org.id } },
    });

    return { pet };
  }
}
