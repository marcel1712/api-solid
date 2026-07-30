import { PetRepository } from "../repositories/pet-repository";
import { describe, it, beforeEach, expect } from "vitest";
import { MarkPetAsAdoptedUseCase } from "./markPetAsAdoptedUseCase";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";

let petRepository: PetRepository;
let sut: MarkPetAsAdoptedUseCase;

async function createPet() {
  return petRepository.create({
    name: "Nick",
    age: 9,
    size: "Small",
    type: "Dog",
    bio: "...",
    org: { connect: { id: "org-01" } },
  });
}

describe("Mark Pet As Adopted Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    sut = new MarkPetAsAdoptedUseCase(petRepository);
  });

  it("should be able to mark a pet as adopted", async () => {
    const pet = await createPet();

    const { pet: updatedPet } = await sut.execute({
      petId: pet.id,
      adopted: true,
    });

    expect(updatedPet.adopted).toEqual(true);
  });

  it("should be able to mark a pet as not adopted", async () => {
    const pet = await createPet();

    await sut.execute({
      petId: pet.id,
      adopted: true,
    });

    const { pet: updatedPet } = await sut.execute({
      petId: pet.id,
      adopted: false,
    });

    expect(updatedPet.adopted).toEqual(false);
  });

  it("should persist the adoption status change", async () => {
    const pet = await createPet();

    await sut.execute({
      petId: pet.id,
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
        adopted: true,
      }),
    ).rejects.toThrow(new Error("This pet doesnt exist"));
  });
});