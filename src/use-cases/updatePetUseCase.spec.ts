import { PetRepository } from "../repositories/pet-repository";
import { describe, it, beforeEach, expect } from "vitest";
import { UpdatePetUseCase } from "./updatePetUseCase";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";
import { NotAllowedError } from "./errors/not-allowed-error";

let petRepository: PetRepository;
let sut: UpdatePetUseCase;

async function createPet(orgId = "org-01") {
  return petRepository.create({
    name: "Nick",
    age: 9,
    size: "Small",
    type: "Dog",
    bio: "...",
    org: { connect: { id: orgId } },
  });
}

describe("Update Pet Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    sut = new UpdatePetUseCase(petRepository);
  });

  it("should be able to update a pet's mutable information", async () => {
    const pet = await createPet();

    const updatedPet = await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      name: "Nick Jr.",
      age: 3,
      size: "Large",
      type: "Cat",
      bio: "A calmer boy now",
    });

    expect(updatedPet.name).toEqual("Nick Jr.");
    expect(updatedPet.age).toEqual(3);
    expect(updatedPet.size).toEqual("Large");
    expect(updatedPet.type).toEqual("Cat");
    expect(updatedPet.bio).toEqual("A calmer boy now");
  });

  it("should be able to partially update a pet", async () => {
    const pet = await createPet();

    const updatedPet = await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      age: 4,
    });

    expect(updatedPet.age).toEqual(4);
    expect(updatedPet.name).toEqual(pet.name);
    expect(updatedPet.size).toEqual(pet.size);
  });

  it("should not change the pet's adoption status", async () => {
    const pet = await createPet();

    const updatedPet = await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      name: "Nick Jr.",
    });

    expect(updatedPet.adopted).toEqual(pet.adopted);
  });

  it("should not be able to update a non-existing pet", async () => {
    await expect(() =>
      sut.execute({
        petId: "non-existing-pet-id",
        orgId: "org-01",
        name: "Nick Jr.",
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to update a pet from another org", async () => {
    const pet = await createPet("org-01");

    await expect(() =>
      sut.execute({
        petId: pet.id,
        orgId: "org-02",
        name: "Nick Jr.",
      }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});
