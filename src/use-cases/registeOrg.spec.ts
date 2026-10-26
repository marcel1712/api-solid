import { FakeCnpjLookup } from "@/test/fake-cnpj-lookup";
import { randomCnpj } from "@/test/random-cnpj";
import { OrgRepository } from "../repositories/org-repository";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { RegisterOrgUseCase } from "./registerOrg";
import { describe, it, expect, beforeEach } from "vitest";

let orgRepository: OrgRepository;
let sut: RegisterOrgUseCase;

describe("Register Org Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    sut = new RegisterOrgUseCase(orgRepository, new FakeCnpjLookup());
  });

  it("should be able to register a new org", async () => {
    const { org } = await sut.execute({
      name: "Pet Friends ",
      email: "petfriends@email.com",
      password: "password123",
      whatsapp: "11999999999",
      city: "São Paulo",
      address: "Rua das Flores, 123",
      cnpj: randomCnpj(),
    });

    expect(org.id).toEqual(expect.any(String));
  });

  it("should hash the org password", async () => {
    const { org } = await sut.execute({
      name: "Pet Friends ",
      email: "petfriends@email.com",
      password: "password123",
      whatsapp: "11999999999",
      city: "São Paulo",
      address: "Rua das Flores, 123",
      cnpj: randomCnpj(),
    });

    expect(org.password_hash).not.toEqual("password123");
  });

  it("It shouldn't be possible to register an organization w/ same email", async () => {
    const email = "petfriends@email.com";
    await sut.execute({
      name: "Pet Friends ",
      email,
      password: "password123",
      whatsapp: "11999999999",
      city: "São Paulo",
      address: "Rua das Flores, 123",
      cnpj: randomCnpj(),
    });

    await expect(() =>
      sut.execute({
        name: "Other Pet Friends",
        email,
        password: "123456",
        whatsapp: "11888888888",
        city: "Rio de Janeiro",
        address: "Rua das Palmeiras, 456",
        cnpj: randomCnpj(),
      }),
    ).rejects.toThrow();
  });

  it("should create a id for the org", async () => {
    const { org } = await sut.execute({
      name: "Pet Friends ",
      email: "petfriends@email.com",
      password: "password123",
      whatsapp: "11999999999",
      city: "São Paulo",
      address: "Rua das Flores, 123",
      cnpj: randomCnpj(),
    });

    expect(org.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
