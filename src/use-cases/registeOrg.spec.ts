import { OrgRepository } from "../repositories/org-repository";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { RegisterOrgUseCase } from "./registerOrg";
import { describe, it, expect, beforeEach } from "vitest";
import test from "node:test";

let orgRepository: InMemoryOrgRepository;
let sut: RegisterOrgUseCase;

describe("Register Org Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    sut = new RegisterOrgUseCase(orgRepository);
  });

  it("should be able to register a new org", async () => {
    const { org } = await sut.execute({
      name: "Pet Friends ",
      email: "petfriends@email.com",
      password: "password123",
      whatsapp: "11999999999",
      city: "São Paulo",
      address: "Rua das Flores, 123",
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
    });

    await expect(() =>
      sut.execute({
        name: "Other Pet Friends",
        email,
        password: "123456",
        whatsapp: "11888888888",
        city: "Rio de Janeiro",
        address: "Rua das Palmeiras, 456",
      }),
    ).rejects.toThrow();
  });

  it;
});
