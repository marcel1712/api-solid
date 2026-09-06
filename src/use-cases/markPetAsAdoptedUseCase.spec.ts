import { PetRepository } from "../repositories/pet-repository";
import { describe, it, beforeEach, expect } from "vitest";
import { MarkPetAsAdoptedUseCase } from "./markPetAsAdoptedUseCase";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";
import { NotAllowedError } from "./errors/not-allowed-error";

let petRepository: PetRepository;
let sut: MarkPetAsAdoptedUseCase;

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

describe("Mark Pet As Adopted Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    sut = new MarkPetAsAdoptedUseCase(petRepository);
  });

  it("should be able to mark a pet as adopted", async () => {
    const pet = await createPet();

    const updatedPet  = await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      adopted: true,
    });

    expect(updatedPet.adopted).toEqual(true);
  });

  it("should be able to mark a pet as not adopted", async () => {
    const pet = await createPet();

    await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      adopted: true,
    });

    const updatedPet = await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      adopted: false,
    });

    expect(updatedPet.adopted).toEqual(false);
  });

  it("should persist the adoption status change", async () => {
    const pet = await createPet();

    await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      adopted: true,
    });

    expect(
      (petRepository as InMemoryPetRepository).items[0].adopted,
    ).toEqual(true);
  });

  it("should not be able to update adoption status of a non-existing pet", async () => {
    await expect(() =>
      sut.execute({
        petId: "non-existing-pet-id",
        orgId: "org-01",
        adopted: true,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to update adoption status of a pet from another org", async () => {
    const pet = await createPet("org-01");

    await expect(() =>
      sut.execute({
        petId: pet.id,
        orgId: "org-02",
        adopted: true,
      }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});
