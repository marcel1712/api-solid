import { beforeEach, describe, expect, it } from "vitest";
import { InMemorySessionRepository } from "@/repositories/in-memory/in-memory-session-repository";
import { InMemoryEmailVerificationTokenRepository } from "@/repositories/in-memory/in-memory-email-verification-token-repository";
import { InMemoryPasswordResetTokenRepository } from "@/repositories/in-memory/in-memory-password-reset-token-repository";
import {
  EMAIL_TOKEN_GRACE_MS,
  PurgeExpiredAuthRecordsUseCase,
} from "./purgeExpiredAuthRecordsUseCase";

const HOUR = 60 * 60 * 1000;
const now = new Date("2026-10-27T12:00:00Z");
const at = (offset: number) => new Date(now.getTime() + offset);

let sessions: InMemorySessionRepository;
let verificationTokens: InMemoryEmailVerificationTokenRepository;
let resetTokens: InMemoryPasswordResetTokenRepository;
let sut: PurgeExpiredAuthRecordsUseCase;

describe("Purge Expired Auth Records Use Case", () => {
  beforeEach(() => {
    sessions = new InMemorySessionRepository();
    verificationTokens = new InMemoryEmailVerificationTokenRepository();
    resetTokens = new InMemoryPasswordResetTokenRepository();
    sut = new PurgeExpiredAuthRecordsUseCase(
      sessions,
      verificationTokens,
      resetTokens,
    );
  });

  it("should delete expired sessions and keep live ones, rotated included", async () => {
    await sessions.create({ orgId: "o", tokenHash: "expired", expiresAt: at(-HOUR) });
    const rotated = await sessions.create({
      orgId: "o",
      tokenHash: "rotated",
      expiresAt: at(HOUR),
    });
    await sessions.markReplaced(rotated.id, "new-session");

    const result = await sut.execute(now);

    expect(result.sessions).toEqual(1);
    expect(sessions.items.map((item) => item.tokenHash)).toEqual(["rotated"]);
  });

  it("should keep email tokens for a day after they expire", async () => {
    await verificationTokens.create({
      orgId: "o",
      tokenHash: "long-gone",
      expiresAt: at(-EMAIL_TOKEN_GRACE_MS - HOUR),
    });
    await verificationTokens.create({
      orgId: "o",
      tokenHash: "just-expired",
      expiresAt: at(-HOUR),
    });
    await resetTokens.create({
      orgId: "o",
      tokenHash: "long-gone",
      expiresAt: at(-EMAIL_TOKEN_GRACE_MS - HOUR),
    });

    const result = await sut.execute(now);

    expect(result.emailVerificationTokens).toEqual(1);
    expect(result.passwordResetTokens).toEqual(1);
    expect(verificationTokens.items.map((item) => item.tokenHash)).toEqual([
      "just-expired",
    ]);
  });
});
