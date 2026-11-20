import { OrgRepository } from "../repositories/org-repository";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { OrgStatus } from "@prisma/client";
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

  describe("when the org is already approved", () => {
    const notify = vi.fn();

    beforeEach(() => {
      notify.mockReset().mockResolvedValue(undefined);
      sut = new UpdateOrgUseCase(orgRepository, {
        notifyApprovedOrgChanged: notify,
      });
    });

    async function createApprovedOrg() {
      const org = await createOrg();
      await orgRepository.updateStatus(org.id, OrgStatus.Approved);
      return org;
    }

    it("should tell the team when the WhatsApp changes", async () => {
      const org = await createApprovedOrg();

      await sut.execute({
        orgId: org.id,
        requesterOrgId: org.id,
        whatsapp: "+5511988888888",
      });

      expect(notify).toHaveBeenCalledWith({
        orgName: "Pet Friends",
        changes: [
          { label: "WhatsApp", before: "+5511999999999", after: "+5511988888888" },
        ],
      });
    });

    it("should not bother the team over the address", async () => {
      const org = await createApprovedOrg();

      await sut.execute({
        orgId: org.id,
        requesterOrgId: org.id,
        address: "Av. Central, 100",
      });

      expect(notify).not.toHaveBeenCalled();
    });

    it("should keep the change when the notice can't be sent", async () => {
      const org = await createApprovedOrg();
      notify.mockRejectedValueOnce(new Error("Resend is down"));

      const updated = await sut.execute({
        orgId: org.id,
        requesterOrgId: org.id,
        name: "Outro Nome",
      });

      expect(updated.name).toEqual("Outro Nome");
    });
  });

  it("should not notify anyone while the org is still under review", async () => {
    const notify = vi.fn();
    sut = new UpdateOrgUseCase(orgRepository, { notifyApprovedOrgChanged: notify });
    const org = await createOrg();

    await sut.execute({
      orgId: org.id,
      requesterOrgId: org.id,
      whatsapp: "+5511988888888",
    });

    expect(notify).not.toHaveBeenCalled();
  });
});
