import { describe, it, beforeEach, expect } from "vitest";
import { OrgRepository } from "../repositories/org-repository";
import { EmailVerificationTokenRepository } from "../repositories/email-verification-token-repository";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { InMemoryEmailVerificationTokenRepository } from "../repositories/in-memory/in-memory-email-verification-token-repository";
import { Mailer } from "@/lib/mailer";
import { SendEmailVerificationUseCase } from "./sendEmailVerificationUseCase";
import { ResendEmailVerificationUseCase } from "./resendEmailVerificationUseCase";

class FakeMailer implements Mailer {
  public sentVerificationEmails: { to: string; verifyUrl: string }[] = [];

  async sendPasswordResetEmail(): Promise<void> {}

  async sendVerificationEmail(params: {
    to: string;
    verifyUrl: string;
  }): Promise<void> {
    this.sentVerificationEmails.push(params);
  }
}

let orgRepository: OrgRepository;
let emailVerificationTokenRepository: EmailVerificationTokenRepository;
let mailer: FakeMailer;
let sut: ResendEmailVerificationUseCase;

async function createOrg(overrides: { verified?: boolean } = {}) {
  const org = await orgRepository.create({
    name: "Pet Friends",
    email: "petfriends@email.com",
    password_hash: "hashed-password",
    whatsapp: "+5511999999999",
    city: "São Carlos",
    address: "Rua das Flores, 900",
  });

  if (overrides.verified) {
    await orgRepository.markEmailAsVerified(org.id);
  }

  return org;
}

describe("Resend Email Verification Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    emailVerificationTokenRepository =
      new InMemoryEmailVerificationTokenRepository();
    mailer = new FakeMailer();
    const sendEmailVerificationUseCase = new SendEmailVerificationUseCase(
      emailVerificationTokenRepository,
      mailer,
    );
    sut = new ResendEmailVerificationUseCase(
      orgRepository,
      sendEmailVerificationUseCase,
    );
  });

  it("should send a new verification email for an unverified org", async () => {
    const org = await createOrg();

    await sut.execute({ email: org.email });

    expect(mailer.sentVerificationEmails).toHaveLength(1);
    expect(mailer.sentVerificationEmails[0].to).toEqual(org.email);
  });

  it("should not send an email when the org is already verified", async () => {
    const org = await createOrg({ verified: true });

    await sut.execute({ email: org.email });

    expect(mailer.sentVerificationEmails).toHaveLength(0);
  });

  it("should not throw or send an email when the email doesn't exist", async () => {
    await expect(
      sut.execute({ email: "unknown@email.com" }),
    ).resolves.toBeUndefined();

    expect(mailer.sentVerificationEmails).toHaveLength(0);
  });
});
