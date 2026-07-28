import { OrgRepository } from "@/repositories/org-repository";
import { describe, it, expect, beforeEach } from "vitest";
import { AuthenticateOrgUseCase } from "../use-cases/authenticateOrgUseCase";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { RegisterOrgUseCase } from "./registerOrg";

let orgRepository: OrgRepository;
let registerUseCase: RegisterOrgUseCase;
let sut: AuthenticateOrgUseCase;

describe("Authenticate Org Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    registerUseCase = new RegisterOrgUseCase(orgRepository);
    sut = new AuthenticateOrgUseCase(orgRepository);
  });

  it("should be able to authenticated w/ a correct email and password ", async () => {
    const { org } = await registerUseCase.execute({
      name: "Pet Friends ",
      email: "petfriends@email.com",
      password: "password123",
      whatsapp: "11999999999",
      city: "São Paulo",
      address: "Rua das Flores, 123",
    });

    const logedOrg = await sut.execute({
      email: "petfriends@email.com",
      password: "password123",
    });

    expect(logedOrg.org.email).toBe(org.email);
  });

  it("should not be able to authenticate with a non-existing email", async () => {
    await expect(() =>
      sut.execute({
        email: "petfriends@email.com",
        password: "password123",
      }),
    ).rejects.toThrow();
  });

  it("should not be able to authenticate with the wrong password", async () => {
    await registerUseCase.execute({
      name: "Pet Friends ",
      email: "petfriends@email.com",
      password: "password123",
      whatsapp: "11999999999",
      city: "São Paulo",
      address: "Rua das Flores, 123",
    });

    await expect(() =>
      sut.execute({
        email: "petfriends@email.com",
        password: "wrong-password",
      }),
    ).rejects.toThrow();
  });

  it("should not expose the password hash on the authenticated org", async () => {
    await registerUseCase.execute({
      name: "Pet Friends ",
      email: "petfriends@email.com",
      password: "password123",
      whatsapp: "11999999999",
      city: "São Paulo",
      address: "Rua das Flores, 123",
    });

    const logedOrg = await sut.execute({
      email: "petfriends@email.com",
      password: "password123",
    });

    expect(logedOrg.org).not.toHaveProperty("password_hash");
  });
});
