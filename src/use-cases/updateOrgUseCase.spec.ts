import { OrgRepository } from "../repositories/org-repository";
import { describe, it, beforeEach, expect } from "vitest";
import { UpdateOrgUseCase } from "./updateOrgUseCase";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";
import { NotAllowedError } from "./errors/not-allowed-error";

let orgRepository: OrgRepository;
let sut: UpdateOrgUseCase;

async function createOrg() {
  return orgRepository.create({
    name: "Pet Friends",
    email: "contact@petfriends.com",
    password_hash: "hashed-password",
    whatsapp: "+5511999999999",
    city: "São Carlos",
    address: "Rua das Flores, 900",
  });
}

describe("Update Org Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    sut = new UpdateOrgUseCase(orgRepository);
  });

  it("should be able to update an org's mutable information", async () => {
    const org = await createOrg();

    const updatedOrg = await sut.execute({
      orgId: org.id,
      requesterOrgId: org.id,
      name: "New Pet Friends",
      whatsapp: "+5511988888888",
      city: "Campinas",
      address: "Av. Central, 100",
    });

    expect(updatedOrg.name).toEqual("New Pet Friends");
    expect(updatedOrg.whatsapp).toEqual("+5511988888888");
    expect(updatedOrg.city).toEqual("Campinas");
    expect(updatedOrg.address).toEqual("Av. Central, 100");
  });

  it("should be able to partially update an org", async () => {
    const org = await createOrg();

    const updatedOrg = await sut.execute({
      orgId: org.id,
      requesterOrgId: org.id,
      city: "Campinas",
    });

    expect(updatedOrg.city).toEqual("Campinas");
    expect(updatedOrg.name).toEqual(org.name);
    expect(updatedOrg.address).toEqual(org.address);
  });

  it("should not change the org's email or password", async () => {
    const org = await createOrg();

    const updatedOrg = await sut.execute({
      orgId: org.id,
      requesterOrgId: org.id,
      name: "New Pet Friends",
    });

    expect(updatedOrg.email).toEqual(org.email);
    expect(updatedOrg.password_hash).toEqual(org.password_hash);
  });

  it("should not be able to update a non-existing org", async () => {
    await expect(() =>
      sut.execute({
        orgId: "non-existing-org-id",
        requesterOrgId: "non-existing-org-id",
        name: "New Pet Friends",
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("should not be able to update another org's information", async () => {
    const org = await createOrg();

    await expect(() =>
      sut.execute({
        orgId: org.id,
        requesterOrgId: "another-org-id",
        name: "New Pet Friends",
      }),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});
