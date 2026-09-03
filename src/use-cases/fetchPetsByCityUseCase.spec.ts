import { describe, it, beforeEach, expect } from "vitest";
import { PetRepository } from "../repositories/pet-repository";
import { OrgRepository } from "../repositories/org-repository";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { RegisterOrgUseCase } from "./registerOrg";
import { RegisterPetUseCase } from "./registerPet";
import { FetchPetByCityUseCase } from "./fetchPetsByCityUseCase";

let petRepository: PetRepository;
let orgRepository: OrgRepository;
let registerOrgUseCase: RegisterOrgUseCase;
let registerPetUseCase: RegisterPetUseCase;
let sut: FetchPetByCityUseCase;

async function createOrg(overrides: Partial<Parameters<RegisterOrgUseCase["execute"]>[0]> = {}) {
  const { org } = await registerOrgUseCase.execute({
    name: "Pet Friends",
    email: overrides.email ?? `org-${Math.random()}@email.com`,
    password: "password123",
    whatsapp: "11999999999",
    city: "São Paulo",
    address: "Rua das Flores, 123",
    ...overrides,
  });

  return org;
}

async function createPet(
  orgId: string,
  overrides: Partial<Parameters<RegisterPetUseCase["execute"]>[0]> = {},
) {
  const { pet } = await registerPetUseCase.execute({
    name: "Nick",
    age: 9,
    size: "Small",
    type: "Dog",
    bio: "...",
    orgId,
    ...overrides,
  });

  return pet;
}

describe("Fetch Pet By City Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    orgRepository = new InMemoryOrgRepository();
    registerOrgUseCase = new RegisterOrgUseCase(orgRepository);
    registerPetUseCase = new RegisterPetUseCase(petRepository, orgRepository);
    sut = new FetchPetByCityUseCase(petRepository, orgRepository);
  });

  it("should be able to fetch pets from a city", async () => {
    const org = await createOrg({ city: "São Paulo" });
    await createPet(org.id);

    const pets = await sut.execute({ city: "São Paulo", page: 1 });

    expect(pets).toHaveLength(1);
  });

  it("should return pets from multiple orgs in the same city", async () => {
    const firstOrg = await createOrg({ city: "São Paulo" });
    const secondOrg = await createOrg({ city: "São Paulo" });
    await createPet(firstOrg.id, { name: "Nick" });
    await createPet(secondOrg.id, { name: "Mimi" });

    const pets = await sut.execute({ city: "São Paulo", page: 1 });

    expect(pets).toHaveLength(2);
  });

  it("should not return pets from orgs in a different city", async () => {
    const spOrg = await createOrg({ city: "São Paulo" });
    const rjOrg = await createOrg({ city: "Rio de Janeiro" });
    await createPet(spOrg.id, { name: "Nick" });
    await createPet(rjOrg.id, { name: "Mimi" });

    const pets = await sut.execute({ city: "São Paulo", page: 1 });

    expect(pets).toHaveLength(1);
    expect(pets?.[0].name).toEqual("Nick");
  });

  it("should return an empty list when there are no orgs in the given city", async () => {
    const org = await createOrg({ city: "São Paulo" });
    await createPet(org.id);

    const pets = await sut.execute({ city: "Curitiba", page: 1 });

    expect(pets).toHaveLength(0);
  });

  it("should not be able to fetch pets without a city", async () => {
    await expect(() => sut.execute({ city: "", page: 1 })).rejects.toThrow(
      new Error("City is required"),
    );
  });

  it("should return an empty list when the city has orgs but no pets", async () => {
    await createOrg({ city: "São Paulo" });

    const pets = await sut.execute({ city: "São Paulo", page: 1 });

    expect(pets).toHaveLength(0);
  });

  it("should be able to filter pets by age", async () => {
    const org = await createOrg({ city: "São Paulo" });
    await createPet(org.id, { name: "Nick", age: 2 });
    await createPet(org.id, { name: "Mimi", age: 9 });

    const pets = await sut.execute({ city: "São Paulo", age: 2, page: 1 });

    expect(pets).toHaveLength(1);
    expect(pets?.[0].name).toEqual("Nick");
  });

  it("should be able to filter pets by size", async () => {
    const org = await createOrg({ city: "São Paulo" });
    await createPet(org.id, { name: "Nick", size: "Small" });
    await createPet(org.id, { name: "Mimi", size: "Large" });

    const pets = await sut.execute({ city: "São Paulo", size: "Large", page: 1 });

    expect(pets).toHaveLength(1);
    expect(pets?.[0].name).toEqual("Mimi");
  });

  it("should be able to filter pets by type", async () => {
    const org = await createOrg({ city: "São Paulo" });
    await createPet(org.id, { name: "Nick", type: "Dog" });
    await createPet(org.id, { name: "Mimi", type: "Cat" });

    const pets = await sut.execute({ city: "São Paulo", type: "Cat", page: 1 });

    expect(pets).toHaveLength(1);
    expect(pets?.[0].name).toEqual("Mimi");
  });

  it("should be able to combine multiple filters", async () => {
    const org = await createOrg({ city: "São Paulo" });
    await createPet(org.id, { name: "Nick", type: "Dog", size: "Small", age: 2 });
    await createPet(org.id, { name: "Mimi", type: "Dog", size: "Large", age: 2 });

    const pets = await sut.execute({
      city: "São Paulo",
      type: "Dog",
      size: "Small",
      age: 2,
      page: 1,
    });

    expect(pets).toHaveLength(1);
    expect(pets?.[0].name).toEqual("Nick");
  });

  it("should return an empty list when no pet matches the given filters", async () => {
    const org = await createOrg({ city: "São Paulo" });
    await createPet(org.id, { type: "Dog" });

    const pets = await sut.execute({ city: "São Paulo", type: "Cat", page: 1 });

    expect(pets).toHaveLength(0);
  });
});