import { describe, it, beforeEach, expect, vi } from "vitest";
import { PetRepository } from "../repositories/pet-repository";
import { PetImageRepository } from "../repositories/pet-image-repository";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { InMemoryPetImageRepository } from "../repositories/in-memory/in-memory-pet-image-repository";
import { RequestPetImageUploadUseCase } from "./requestPetImageUploadUseCase";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";
import { NotAllowedError } from "./errors/not-allowed-error";
import { LimitExceededError } from "./errors/limit-exceeded-error";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/signed-upload-url"),
}));

vi.mock("@/lib/r2", () => ({
  r2: {},
}));

let petRepository: PetRepository;
let petImageRepository: PetImageRepository;
let sut: RequestPetImageUploadUseCase;

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

describe("Request Pet Image Upload Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    petImageRepository = new InMemoryPetImageRepository();
    sut = new RequestPetImageUploadUseCase(petRepository, petImageRepository);
  });

  it("should be able to request an image upload for a pet", async () => {
    const pet = await createPet();

    const { key, url, uploadUrl } = await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      contentType: "image/jpeg",
    });

    expect(key).toContain(pet.id);
    expect(url).toContain(key);
    expect(uploadUrl).toEqual("https://r2.example.com/signed-upload-url");
  });

  it("should not persist anything before the upload is confirmed", async () => {
    const pet = await createPet();

    await sut.execute({
      petId: pet.id,
      orgId: "org-01",
      contentType: "image/jpeg",
    });

    expect(
      (petImageRepository as InMemoryPetImageRepository).items,
    ).toHaveLength(0);
  });

  it("should not be able to request an upload for a non-existing pet", async () => {
    await expect(() =>
      sut.execute({
        petId: "non-existing-pet-id",
        orgId: "org-01",
        contentType: "image/jpeg",
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to request an upload for another org's pet", async () => {
    const pet = await createPet("org-01");

    await expect(() =>
      sut.execute({
        petId: pet.id,
        orgId: "org-02",
        contentType: "image/jpeg",
      }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should not be able to request a 4th image for a pet that already has 3 confirmed images", async () => {
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
        contentType: "image/jpeg",
      }),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });
});
