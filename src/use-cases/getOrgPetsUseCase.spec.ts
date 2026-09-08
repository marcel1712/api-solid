import { describe, it, beforeEach, expect } from "vitest";
import { PetRepository } from "../repositories/pet-repository";
import { PetImageRepository } from "../repositories/pet-image-repository";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { InMemoryPetImageRepository } from "../repositories/in-memory/in-memory-pet-image-repository";
import { GetOrgPetsUseCase } from "./getOrgPetsUseCase";

let petRepository: PetRepository;
let petImageRepository: PetImageRepository;
let sut: GetOrgPetsUseCase;

async function createPet(orgId: string, overrides: Record<string, unknown> = {}) {
  return petRepository.create({
    name: "Nick",
    age: 9,
    size: "Small",
    type: "Dog",
    bio: "...",
    org: { connect: { id: orgId } },
    ...overrides,
  });
}

describe("Get Org Pets Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    petImageRepository = new InMemoryPetImageRepository();
    sut = new GetOrgPetsUseCase(petRepository, petImageRepository);
  });

  it("should be able to list all pets from an org", async () => {
    await createPet("org-01");
    await createPet("org-01");

    const pets = await sut.execute({ orgId: "org-01", page: 1 });

    expect(pets).toHaveLength(2);
  });

  it("should not return pets from other orgs", async () => {
    await createPet("org-01");
    await createPet("org-02");

    const pets = await sut.execute({ orgId: "org-01", page: 1 });

    expect(pets).toHaveLength(1);
  });

  it("should include already adopted pets", async () => {
    const pet = await createPet("org-01");
    await petRepository.updateAdoptionStatus(pet.id, true);

    const pets = await sut.execute({ orgId: "org-01", page: 1 });

    expect(pets).toHaveLength(1);
    expect(pets[0].adopted).toEqual(true);
  });

  it("should include each pet's images", async () => {
    const pet = await createPet("org-01");
    await petImageRepository.create({
      petId: pet.id,
      key: "pets/pet-id/image.jpg",
      url: "https://example.com/pets/pet-id/image.jpg",
    });

    const pets = await sut.execute({ orgId: "org-01", page: 1 });

    expect(pets[0].images).toHaveLength(1);
  });

  it("should return an empty list when the org has no pets", async () => {
    const pets = await sut.execute({ orgId: "org-01", page: 1 });

    expect(pets).toHaveLength(0);
  });
});
