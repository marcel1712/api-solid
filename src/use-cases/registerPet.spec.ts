import { PetRepository } from "../repositories/pet-repository";
import { describe, it, beforeEach, expect } from "vitest";
import { RegisterPetUseCase } from "./registerPet";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { OrgRepository } from "../repositories/org-repository";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { RegisterOrgUseCase } from "./registerOrg";

let petRepository: PetRepository;
let orgRepository: OrgRepository;
let registerOrgUseCase: RegisterOrgUseCase;
let sut: RegisterPetUseCase;

async function createOrg() {
  const { org } = await registerOrgUseCase.execute({
    name: "Pet Friends ",
    email: "petfriends@email.com",
    password: "password123",
    whatsapp: "11999999999",
    city: "São Paulo",
    address: "Rua das Flores, 123",
  });

  return org;
}

describe("Register Pet Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    orgRepository = new InMemoryOrgRepository();
    registerOrgUseCase = new RegisterOrgUseCase(orgRepository);
    sut = new RegisterPetUseCase(petRepository, orgRepository);
  });

  it("should be able to register a new pet", async () => {
    const org = await createOrg();

    const { pet } = await sut.execute({
      name: "Nick",
      age: 9,
      size: "Small",
      type: "Dog",
      bio: "...",
      orgId: org.id,
    });

    expect(pet.id).toEqual(expect.any(String));
  });

  it("should create a uuid formatted id for the pet", async () => {
    const org = await createOrg();

    const { pet } = await sut.execute({
      name: "Nick",
      age: 9,
      size: "Small",
      type: "Dog",
      bio: "...",
      orgId: org.id,
    });

    expect(pet.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("should persist all pet data correctly", async () => {
    const org = await createOrg();

    const { pet } = await sut.execute({
      name: "Nick",
      age: 9,
      size: "Small",
      type: "Dog",
      bio: "A very good boy",
      orgId: org.id,
    });

    expect(pet).toEqual(
      expect.objectContaining({
        name: "Nick",
        age: 9,
        size: "Small",
        type: "Dog",
        bio: "A very good boy",
        orgId: org.id,
      }),
    );
  });

  it("should link the pet to the correct org", async () => {
    const org = await createOrg();

    const { pet } = await sut.execute({
      name: "Nick",
      age: 9,
      size: "Small",
      type: "Dog",
      bio: "...",
      orgId: org.id,
    });

    expect(pet.orgId).toEqual(org.id);
  });

  it("should register the pet as not adopted by default", async () => {
    const org = await createOrg();

    const { pet } = await sut.execute({
      name: "Nick",
      age: 9,
      size: "Small",
      type: "Dog",
      bio: "...",
      orgId: org.id,
    });

    expect(pet.adopted).toEqual(false);
  });

  it("should not be able to register a pet for a non-existing org", async () => {
    await expect(() =>
      sut.execute({
        name: "Nick",
        age: 9,
        size: "Small",
        type: "Dog",
        bio: "...",
        orgId: "non-existing-org-id",
      }),
    ).rejects.toThrow(new Error("This org doesnt exist"));
  });

  it("should be able to register multiple pets for the same org", async () => {
    const org = await createOrg();

    const { pet: firstPet } = await sut.execute({
      name: "Nick",
      age: 9,
      size: "Small",
      type: "Dog",
      bio: "...",
      orgId: org.id,
    });

    const { pet: secondPet } = await sut.execute({
      name: "Mimi",
      age: 2,
      size: "Medium",
      type: "Cat",
      bio: "...",
      orgId: org.id,
    });

    expect(firstPet.id).not.toEqual(secondPet.id);
    expect(petRepository).toHaveProperty("items");
    expect((petRepository as InMemoryPetRepository).items).toHaveLength(2);
  });
});
