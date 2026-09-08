import { describe, it, beforeEach, expect, vi } from "vitest";
import { PetRepository } from "../repositories/pet-repository";
import { PetImageRepository } from "../repositories/pet-image-repository";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { InMemoryPetImageRepository } from "../repositories/in-memory/in-memory-pet-image-repository";
import { ConfirmPetImageUploadUseCase } from "./confirmPetImageUploadUseCase";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";
import { NotAllowedError } from "./errors/not-allowed-error";
import { LimitExceededError } from "./errors/limit-exceeded-error";

const sendMock = vi.fn().mockResolvedValue({});

const { NotFoundError } = vi.hoisted(() => {
  class NotFoundError extends Error {
    name = "NotFound";
  }
  return { NotFoundError };
});

vi.mock("@aws-sdk/client-s3", async () => {
  const actual = await vi.importActual<typeof import("@aws-sdk/client-s3")>(
    "@aws-sdk/client-s3",
  );
  return {
    ...actual,
    NotFound: NotFoundError,
  };
});

vi.mock("@/lib/r2", () => ({
  r2: { send: (...args: unknown[]) => sendMock(...args) },
}));

let petRepository: PetRepository;
let petImageRepository: PetImageRepository;
let sut: ConfirmPetImageUploadUseCase;

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

describe("Confirm Pet Image Upload Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    petImageRepository = new InMemoryPetImageRepository();
    sut = new ConfirmPetImageUploadUseCase(petRepository, petImageRepository);
    sendMock.mockReset().mockResolvedValue({});
  });

  it("should persist the image once the upload is confirmed to exist", async () => {
    const pet = await createPet();
    const key = `pets/${pet.id}/photo.jpg`;

    const image = await sut.execute({ petId: pet.id, orgId: "org-01", key });

    expect(image.petId).toEqual(pet.id);
    expect(image.key).toEqual(key);
    expect(
      (petImageRepository as InMemoryPetImageRepository).items,
    ).toHaveLength(1);
  });

  it("should not persist the image if the object doesn't exist in storage", async () => {
    const pet = await createPet();
    const key = `pets/${pet.id}/photo.jpg`;
    sendMock.mockRejectedValueOnce(new NotFoundError());

    await expect(() =>
      sut.execute({ petId: pet.id, orgId: "org-01", key }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(
      (petImageRepository as InMemoryPetImageRepository).items,
    ).toHaveLength(0);
  });

  it("should not be able to confirm an upload for a non-existing pet", async () => {
    await expect(() =>
      sut.execute({
        petId: "non-existing-pet-id",
        orgId: "org-01",
        key: "pets/non-existing-pet-id/photo.jpg",
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to confirm an upload for another org's pet", async () => {
    const pet = await createPet("org-01");

    await expect(() =>
      sut.execute({
        petId: pet.id,
        orgId: "org-02",
        key: `pets/${pet.id}/photo.jpg`,
      }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should not be able to confirm a key that doesn't belong to the pet", async () => {
    const pet = await createPet();
    const otherPet = await createPet();

    await expect(() =>
      sut.execute({
        petId: pet.id,
        orgId: "org-01",
        key: `pets/${otherPet.id}/photo.jpg`,
      }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should not be able to confirm a 4th image for the same pet", async () => {
    const pet = await createPet();

    for (let i = 0; i < 3; i++) {
      await petImageRepository.create({
        petId: pet.id,
        key: `pets/${pet.id}/image-${i}.jpg`,
        url: `https://example.com/pets/${pet.id}/image-${i}.jpg`,
      });
    }

    await expect(() =>
      sut.execute({
        petId: pet.id,
        orgId: "org-01",
        key: `pets/${pet.id}/photo.jpg`,
      }),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });
});
