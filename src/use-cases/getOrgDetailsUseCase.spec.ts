import { describe, it, beforeEach, expect } from "vitest";
import { OrgRepository } from "@/repositories/org-repository";
import { InMemoryOrgRepository } from "@/repositories/in-memory/in-memory-org-repository";
import { GetOrgDetailsUseCase } from "./getOrgDetailsUseCase";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

let orgRepository: OrgRepository;
let sut: GetOrgDetailsUseCase;

async function createOrg() {
  return orgRepository.create({
    name: "Pet Friends",
    email: "petfriends@email.com",
    password_hash: "hashed-password",
    whatsapp: "+5511999999999",
    city: "São Paulo",
    address: "Rua das Flores, 123",
  });
}

describe("Get Org Details Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    sut = new GetOrgDetailsUseCase(orgRepository);
  });

  it("should be able to get org details", async () => {
    const createdOrg = await createOrg();

    const org = await sut.execute({ orgId: createdOrg.id });

    expect(org.id).toEqual(createdOrg.id);
    expect(org.name).toEqual("Pet Friends");
    expect(org.whatsapp).toEqual("+5511999999999");
  });

  it("should not be able to get details of a non-existing org", async () => {
    await expect(() =>
      sut.execute({ orgId: "non-existing-org-id" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
