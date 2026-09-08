import { describe, it, beforeEach, expect } from "vitest";
import { EmailVerificationTokenRepository } from "../repositories/email-verification-token-repository";
import { InMemoryEmailVerificationTokenRepository } from "../repositories/in-memory/in-memory-email-verification-token-repository";
import { Mailer } from "@/lib/mailer";
import { SendEmailVerificationUseCase } from "./sendEmailVerificationUseCase";

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

let emailVerificationTokenRepository: EmailVerificationTokenRepository;
let mailer: FakeMailer;
let sut: SendEmailVerificationUseCase;

describe("Send Email Verification Use Case", () => {
  beforeEach(() => {
    emailVerificationTokenRepository =
      new InMemoryEmailVerificationTokenRepository();
    mailer = new FakeMailer();
    sut = new SendEmailVerificationUseCase(
      emailVerificationTokenRepository,
      mailer,
    );
  });

  it("should send a verification email", async () => {
    await sut.execute({ orgId: "org-01", email: "petfriends@email.com" });

    expect(mailer.sentVerificationEmails).toHaveLength(1);
    expect(mailer.sentVerificationEmails[0].to).toEqual(
      "petfriends@email.com",
    );
    expect(mailer.sentVerificationEmails[0].verifyUrl).toContain("token=");
  });

  it("should persist a token for the org", async () => {
    await sut.execute({ orgId: "org-01", email: "petfriends@email.com" });

    const tokens = (
      emailVerificationTokenRepository as InMemoryEmailVerificationTokenRepository
    ).items;
    expect(tokens).toHaveLength(1);
    expect(tokens[0].orgId).toEqual("org-01");
  });

  it("should invalidate previous tokens when a new one is requested", async () => {
    await sut.execute({ orgId: "org-01", email: "petfriends@email.com" });
    await sut.execute({ orgId: "org-01", email: "petfriends@email.com" });

    const tokens = (
      emailVerificationTokenRepository as InMemoryEmailVerificationTokenRepository
    ).items;
    expect(tokens).toHaveLength(1);
  });
});
