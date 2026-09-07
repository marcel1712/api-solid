import { PetRepository } from "../repositories/pet-repository";
import { describe, it, beforeEach, expect } from "vitest";
import { GetPetDetailsUseCase } from "./getPetDetailsUseCase";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { InMemoryOrgRepository } from "@/repositories/in-memory/in-memory-org-repository";
import { OrgRepository } from "@/repositories/org-repository";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

let orgRepository: OrgRepository
let petRepository: PetRepository;
let sut: GetPetDetailsUseCase;

async function createOrg() {
  (orgRepository as InMemoryOrgRepository).items.push({
    id: "org-01",
    name: "Pet Friends",
    email: "petfriends@email.com",
    password_hash: "hashed-password",
    whatsapp: "+5511999999999",
    city: "São Paulo",
    address: "Rua das Flores, 123",
    created_at: new Date(),
  });
}

async function createPet() {
  return petRepository.create({
    name: "Nick",
    age: 9,
    size: "Small",
    type: "Dog",
    bio: "A very good boy",
    org: { connect: { id: "org-01" } },
  });
}

describe("Get Pet Details Use Case", () => {
  beforeEach(async () => {
    orgRepository = new InMemoryOrgRepository();
    petRepository = new InMemoryPetRepository();
    sut = new GetPetDetailsUseCase(petRepository, orgRepository);

    await createOrg();
  });

  it("should be able to get pet details", async () => {
    const createdPet = await createPet();

    const { pet } = await sut.execute({ petId: createdPet.id });

    expect(pet.id).toEqual(createdPet.id);
  });

  it("should return all pet data", async () => {
    const createdPet = await createPet();

    const { pet, whatsapp } = await sut.execute({ petId: createdPet.id });

    expect(pet).toEqual(
      expect.objectContaining({
        name: "Nick",
        age: 9,
        size: "Small",
        type: "Dog",
        bio: "A very good boy",
        orgId: "org-01",
      }),
    );
    expect(whatsapp).toEqual("+5511999999999");
  });

  it("should not be able to get details of a non-existing pet", async () => {
    await expect(() =>
      sut.execute({ petId: "non-existing-pet-id" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
