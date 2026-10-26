import { describe, it, beforeEach, expect } from "vitest";
import { compare } from "bcrypt";
import { OrgRepository } from "../repositories/org-repository";
import { PasswordResetTokenRepository } from "../repositories/password-reset-token-repository";
import { InMemoryOrgRepository } from "../repositories/in-memory/in-memory-org-repository";
import { InMemoryPasswordResetTokenRepository } from "../repositories/in-memory/in-memory-password-reset-token-repository";
import { InMemorySessionRepository } from "../repositories/in-memory/in-memory-session-repository";
import { ResetPasswordUseCase } from "./resetPasswordUseCase";
import { InvalidOrExpiredTokenError } from "./errors/invalid-or-expired-token-error";
import { hashToken } from "@/utils/hash-token";

let orgRepository: OrgRepository;
let passwordResetTokenRepository: PasswordResetTokenRepository;
let sessionRepository: InMemorySessionRepository;
let sut: ResetPasswordUseCase;

async function createOrg() {
  return orgRepository.create({
    name: "Pet Friends",
    email: "petfriends@email.com",
    password_hash: "old-hashed-password",
    whatsapp: "+5511999999999",
    city: "São Carlos",
    address: "Rua das Flores, 900",
  });
}

async function createValidToken(orgId: string, token = "raw-token") {
  return passwordResetTokenRepository.create({
    orgId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
}

describe("Reset Password Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
    sessionRepository = new InMemorySessionRepository();
    sut = new ResetPasswordUseCase(
      orgRepository,
      passwordResetTokenRepository,
      sessionRepository,
    );
  });

  it("should be able to reset the password with a valid token", async () => {
    const org = await createOrg();
    await createValidToken(org.id, "raw-token");

    await sut.execute({ token: "raw-token", password: "new-password123" });

    const updatedOrg = await orgRepository.findById(org.id);
    const passwordMatches = await compare(
      "new-password123",
      updatedOrg!.password_hash,
    );
    expect(passwordMatches).toBe(true);
  });

  it("should mark the token as used after a successful reset", async () => {
    const org = await createOrg();
    const token = await createValidToken(org.id, "raw-token");

    await sut.execute({ token: "raw-token", password: "new-password123" });

    const usedToken = (
      passwordResetTokenRepository as InMemoryPasswordResetTokenRepository
    ).items.find((item) => item.id === token.id);
    expect(usedToken?.usedAt).not.toBeNull();
  });

  it("should revoke every session of the org after a reset", async () => {
    const org = await createOrg();
    await createValidToken(org.id, "raw-token");
    await sessionRepository.create({
      orgId: org.id,
      tokenHash: "session-1",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await sessionRepository.create({
      orgId: org.id,
      tokenHash: "session-2",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await sut.execute({ token: "raw-token", password: "new-password123" });

    expect(
      sessionRepository.items.every((session) => session.revokedAt !== null),
    ).toBe(true);
  });

  it("should not be able to reuse a token", async () => {
    const org = await createOrg();
    await createValidToken(org.id, "raw-token");

    await sut.execute({ token: "raw-token", password: "new-password123" });

    await expect(() =>
      sut.execute({ token: "raw-token", password: "another-password" }),
    ).rejects.toBeInstanceOf(InvalidOrExpiredTokenError);
  });

  it("should not be able to use an expired token", async () => {
    const org = await createOrg();
    await passwordResetTokenRepository.create({
      orgId: org.id,
      tokenHash: hashToken("expired-token"),
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(() =>
      sut.execute({ token: "expired-token", password: "new-password123" }),
    ).rejects.toBeInstanceOf(InvalidOrExpiredTokenError);
  });

  it("should not be able to use a non-existing token", async () => {
    await expect(() =>
      sut.execute({ token: "non-existing-token", password: "new-password123" }),
    ).rejects.toBeInstanceOf(InvalidOrExpiredTokenError);
  });
});
