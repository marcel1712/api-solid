import { describe, it, beforeEach, expect } from "vitest";
import { OrgRepository } from "../repositories/org-repository";
import { PasswordResetTokenRepository } from "../repositories/password-reset-token-repository";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { InMemoryPasswordResetTokenRepository } from "../repositories/in-memory/in-memory-password-reset-token-repository";
import { Mailer } from "@/lib/mailer";
import { RequestPasswordResetUseCase } from "./requestPasswordResetUseCase";

class FakeMailer implements Mailer {
  public sentEmails: { to: string; resetUrl: string }[] = [];

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
  }): Promise<void> {
    this.sentEmails.push(params);
  }
}

let orgRepository: OrgRepository;
let passwordResetTokenRepository: PasswordResetTokenRepository;
let mailer: FakeMailer;
let sut: RequestPasswordResetUseCase;

async function createOrg(email = "petfriends@email.com") {
  return orgRepository.create({
    name: "Pet Friends",
    email,
    password_hash: "hashed-password",
    whatsapp: "+5511999999999",
    city: "São Carlos",
    address: "Rua das Flores, 900",
  });
}

describe("Request Password Reset Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
    mailer = new FakeMailer();
    sut = new RequestPasswordResetUseCase(
      orgRepository,
      passwordResetTokenRepository,
      mailer,
    );
  });

  it("should send a reset email when the org exists", async () => {
    const org = await createOrg();

    await sut.execute({ email: org.email });

    expect(mailer.sentEmails).toHaveLength(1);
    expect(mailer.sentEmails[0].to).toEqual(org.email);
    expect(mailer.sentEmails[0].resetUrl).toContain("token=");
  });

  it("should persist a token for the org", async () => {
    const org = await createOrg();

    await sut.execute({ email: org.email });

    const tokens = (
      passwordResetTokenRepository as InMemoryPasswordResetTokenRepository
    ).items;
    expect(tokens).toHaveLength(1);
    expect(tokens[0].orgId).toEqual(org.id);
  });

  it("should invalidate previous tokens when a new one is requested", async () => {
    const org = await createOrg();

    await sut.execute({ email: org.email });
    await sut.execute({ email: org.email });

    const tokens = (
      passwordResetTokenRepository as InMemoryPasswordResetTokenRepository
    ).items;
    expect(tokens).toHaveLength(1);
  });

  it("should not send an email or throw when the email doesn't exist", async () => {
    await expect(
      sut.execute({ email: "unknown@email.com" }),
    ).resolves.toBeUndefined();

    expect(mailer.sentEmails).toHaveLength(0);
  });
});
