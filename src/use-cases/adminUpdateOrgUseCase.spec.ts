import { describe, it, beforeEach, expect } from "vitest";
import { CURRENT_TERMS_VERSION } from "@/utils/terms";
import { OrgRepository } from "@/repositories/org-repository";
import { InMemoryOrgRepository } from "@/repositories/in-memory/in-memory-org-repository";
import { InMemoryEmailVerificationTokenRepository } from "@/repositories/in-memory/in-memory-email-verification-token-repository";
import { Mailer } from "@/lib/mailer";
import { SendEmailVerificationUseCase } from "./sendEmailVerificationUseCase";
import { AdminUpdateOrgUseCase } from "./adminUpdateOrgUseCase";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

class FakeMailer implements Mailer {
  public sentVerificationEmails: { to: string; verifyUrl: string }[] = [];
  async sendOrgApprovedEmail() {}
  async sendOrgRejectedEmail() {}
  async sendPasswordResetEmail(): Promise<void> {}
  async sendVerificationEmail(params: {
    to: string;
    verifyUrl: string;
  }): Promise<void> {
    this.sentVerificationEmails.push(params);
  }
}

let orgRepository: OrgRepository;
let mailer: FakeMailer;
let sut: AdminUpdateOrgUseCase;

async function createOrg() {
  const org = await orgRepository.create({
    name: "Pet Friends",
    email: "petfriends@email.com",
    password_hash: "hash",
    whatsapp: "11999999999",
    city: "São Paulo",
    address: "Rua das Flores, 123",
    cnpj: "11222333000181",
    status: "Approved",
    termsVersion: CURRENT_TERMS_VERSION,
    termsAcceptedAt: new Date(),
  });
  await orgRepository.markEmailAsVerified(org.id);
  return (await orgRepository.findById(org.id))!;
}

describe("Admin Update Org Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    mailer = new FakeMailer();
    const emailVerificationTokenRepository =
      new InMemoryEmailVerificationTokenRepository();
    sut = new AdminUpdateOrgUseCase(
      orgRepository,
      new SendEmailVerificationUseCase(emailVerificationTokenRepository, mailer),
    );
  });

  it("should update the org's fields", async () => {
    const org = await createOrg();

    const updated = await sut.execute({
      orgId: org.id,
      name: "Pet Friends Corrigido",
      city: "Rio de Janeiro",
    });

    expect(updated.name).toEqual("Pet Friends Corrigido");
    expect(updated.city).toEqual("Rio de Janeiro");
  });

  it("should reset verification and re-send it when the email changes", async () => {
    const org = await createOrg();
    expect(org.emailVerifiedAt).not.toBeNull();

    const updated = await sut.execute({
      orgId: org.id,
      email: "correct@email.com",
    });

    expect(updated.email).toEqual("correct@email.com");
    expect(updated.emailVerifiedAt).toBeNull();
    expect(mailer.sentVerificationEmails).toHaveLength(1);
    expect(mailer.sentVerificationEmails[0].to).toEqual("correct@email.com");
  });

  it("should not reset verification when the email is unchanged", async () => {
    const org = await createOrg();

    const updated = await sut.execute({
      orgId: org.id,
      email: org.email,
      name: "Pet Friends",
    });

    expect(updated.emailVerifiedAt).not.toBeNull();
    expect(mailer.sentVerificationEmails).toHaveLength(0);
  });

  it("should not be able to update a non-existing org", async () => {
    await expect(() =>
      sut.execute({ orgId: "non-existing-org-id", name: "X" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
