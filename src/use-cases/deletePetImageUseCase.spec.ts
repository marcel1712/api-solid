import { describe, it, beforeEach, expect, vi } from "vitest";
import { PetRepository } from "../repositories/pet-repository";
import { PetImageRepository } from "../repositories/pet-image-repository";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { InMemoryPetImageRepository } from "../repositories/in-memory/in-memory-pet-image-repository";
import { DeletePetImageUseCase } from "./deletePetImageUseCase";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";
import { NotAllowedError } from "./errors/not-allowed-error";

const sendMock = vi.fn().mockResolvedValue({});

vi.mock("@/lib/r2", () => ({
  r2: { send: (...args: unknown[]) => sendMock(...args) },
}));

let petRepository: PetRepository;
let petImageRepository: PetImageRepository;
let sut: DeletePetImageUseCase;

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

describe("Delete Pet Image Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    petImageRepository = new InMemoryPetImageRepository();
    sut = new DeletePetImageUseCase(petRepository, petImageRepository);
    sendMock.mockClear();
  });

  it("should be able to delete a pet's image", async () => {
    const pet = await createPet();
    const image = await petImageRepository.create({
      petId: pet.id,
      key: "pets/pet-id/image.jpg",
      url: "https://example.com/pets/pet-id/image.jpg",
    });

    await sut.execute({ petId: pet.id, imageId: image.id, orgId: "org-01" });

    expect(
      (petImageRepository as InMemoryPetImageRepository).items,
    ).toHaveLength(0);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("should not be able to delete an image of a non-existing pet", async () => {
    await expect(() =>
      sut.execute({
        petId: "non-existing-pet-id",
        imageId: "non-existing-image-id",
        orgId: "org-01",
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to delete an image from another org's pet", async () => {
    const pet = await createPet("org-01");
    const image = await petImageRepository.create({
      petId: pet.id,
      key: "pets/pet-id/image.jpg",
      url: "https://example.com/pets/pet-id/image.jpg",
    });

    await expect(() =>
      sut.execute({ petId: pet.id, imageId: image.id, orgId: "org-02" }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should not be able to delete a non-existing image", async () => {
    const pet = await createPet();

    await expect(() =>
      sut.execute({
        petId: pet.id,
        imageId: "non-existing-image-id",
        orgId: "org-01",
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to delete an image that belongs to a different pet", async () => {
    const pet = await createPet();
    const otherPet = await createPet();
    const image = await petImageRepository.create({
      petId: otherPet.id,
      key: "pets/other-pet-id/image.jpg",
      url: "https://example.com/pets/other-pet-id/image.jpg",
    });

    await expect(() =>
      sut.execute({ petId: pet.id, imageId: image.id, orgId: "org-01" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
