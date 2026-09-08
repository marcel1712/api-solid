import { describe, it, beforeEach, expect } from "vitest";
import { OrgRepository } from "../repositories/org-repository";
import { EmailVerificationTokenRepository } from "../repositories/email-verification-token-repository";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { InMemoryEmailVerificationTokenRepository } from "../repositories/in-memory/in-memory-email-verification-token-repository";
import { VerifyEmailUseCase } from "./verifyEmailUseCase";
import { InvalidOrExpiredTokenError } from "./errors/invalid-or-expired-token-error";
import { hashToken } from "@/utils/hash-token";

let orgRepository: OrgRepository;
let emailVerificationTokenRepository: EmailVerificationTokenRepository;
let sut: VerifyEmailUseCase;

async function createOrg() {
  return orgRepository.create({
    name: "Pet Friends",
    email: "petfriends@email.com",
    password_hash: "hashed-password",
    whatsapp: "+5511999999999",
    city: "São Carlos",
    address: "Rua das Flores, 900",
  });
}

async function createValidToken(orgId: string, token = "raw-token") {
  return emailVerificationTokenRepository.create({
    orgId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}

describe("Verify Email Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    emailVerificationTokenRepository =
      new InMemoryEmailVerificationTokenRepository();
    sut = new VerifyEmailUseCase(orgRepository, emailVerificationTokenRepository);
  });

  it("should be able to verify the email with a valid token", async () => {
    const org = await createOrg();
    await createValidToken(org.id, "raw-token");

    await sut.execute({ token: "raw-token" });

    const updatedOrg = await orgRepository.findById(org.id);
    expect(updatedOrg?.emailVerifiedAt).not.toBeNull();
  });

  it("should mark the token as used after a successful verification", async () => {
    const org = await createOrg();
    const token = await createValidToken(org.id, "raw-token");

    await sut.execute({ token: "raw-token" });

    const usedToken = (
      emailVerificationTokenRepository as InMemoryEmailVerificationTokenRepository
    ).items.find((item) => item.id === token.id);
    expect(usedToken?.usedAt).not.toBeNull();
  });

  it("should not be able to reuse a token", async () => {
    const org = await createOrg();
    await createValidToken(org.id, "raw-token");

    await sut.execute({ token: "raw-token" });

    await expect(() => sut.execute({ token: "raw-token" })).rejects.toBeInstanceOf(
      InvalidOrExpiredTokenError,
    );
  });

  it("should not be able to use an expired token", async () => {
    const org = await createOrg();
    await emailVerificationTokenRepository.create({
      orgId: org.id,
      tokenHash: hashToken("expired-token"),
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(() =>
      sut.execute({ token: "expired-token" }),
    ).rejects.toBeInstanceOf(InvalidOrExpiredTokenError);
  });

  it("should not be able to use a non-existing token", async () => {
    await expect(() =>
      sut.execute({ token: "non-existing-token" }),
    ).rejects.toBeInstanceOf(InvalidOrExpiredTokenError);
  });
});
