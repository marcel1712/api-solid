import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { InMemorySessionRepository } from "../repositories/in-memory/in-memory-session-repository";
import { CreateSessionUseCase } from "./createSessionUseCase";
import {
  RefreshSessionUseCase,
  REUSE_GRACE_PERIOD_MS,
} from "./refreshSessionUseCase";
import { InvalidSessionError } from "./errors/invalid-session-error";
import { hashToken } from "@/utils/hash-token";

let sessionRepository: InMemorySessionRepository;
let createSession: CreateSessionUseCase;
let sut: RefreshSessionUseCase;

describe("Refresh Session Use Case", () => {
  beforeEach(() => {
    sessionRepository = new InMemorySessionRepository();
    createSession = new CreateSessionUseCase(sessionRepository);
    sut = new RefreshSessionUseCase(sessionRepository);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should only store the hash of the refresh token", async () => {
    const { refreshToken } = await createSession.execute({ orgId: "org-1" });

    expect(sessionRepository.items[0].tokenHash).toEqual(
      hashToken(refreshToken),
    );
    expect(sessionRepository.items[0].tokenHash).not.toEqual(refreshToken);
  });

  it("should rotate the refresh token", async () => {
    const { refreshToken } = await createSession.execute({ orgId: "org-1" });

    const result = await sut.execute({ refreshToken });

    expect(result.orgId).toEqual("org-1");
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toEqual(refreshToken);
    expect(sessionRepository.items[0].revokedAt).not.toBeNull();
    expect(sessionRepository.items[1].revokedAt).toBeNull();
  });

  it("should not refresh with an unknown token", async () => {
    await expect(() =>
      sut.execute({ refreshToken: "unknown" }),
    ).rejects.toBeInstanceOf(InvalidSessionError);
  });

  it("should not refresh with an expired session", async () => {
    await sessionRepository.create({
      orgId: "org-1",
      tokenHash: hashToken("expired"),
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(() =>
      sut.execute({ refreshToken: "expired" }),
    ).rejects.toBeInstanceOf(InvalidSessionError);
  });

  it("should tolerate a concurrent reuse inside the grace period", async () => {
    const { refreshToken } = await createSession.execute({ orgId: "org-1" });
    await sut.execute({ refreshToken });

    const result = await sut.execute({ refreshToken });

    expect(result).toEqual({ orgId: "org-1", refreshToken: null });
    expect(sessionRepository.items[1].revokedAt).toBeNull();
  });

  it("should not tolerate reusing a signed-out token", async () => {
    const { sessionId, refreshToken } = await createSession.execute({
      orgId: "org-1",
    });
    await sessionRepository.revoke(sessionId);

    await expect(() => sut.execute({ refreshToken })).rejects.toBeInstanceOf(
      InvalidSessionError,
    );
  });

  it("should not tolerate a reuse once the replacement was revoked", async () => {
    const { refreshToken } = await createSession.execute({ orgId: "org-1" });
    await sut.execute({ refreshToken });
    await sessionRepository.revokeAllByOrgId("org-1");

    await expect(() => sut.execute({ refreshToken })).rejects.toBeInstanceOf(
      InvalidSessionError,
    );
  });

  it("should revoke every session when a rotated token is reused", async () => {
    vi.useFakeTimers();

    const { refreshToken } = await createSession.execute({ orgId: "org-1" });
    await createSession.execute({ orgId: "org-1" });
    await createSession.execute({ orgId: "org-2" });
    await sut.execute({ refreshToken });

    vi.advanceTimersByTime(REUSE_GRACE_PERIOD_MS + 1000);

    await expect(() => sut.execute({ refreshToken })).rejects.toBeInstanceOf(
      InvalidSessionError,
    );

    const org1Sessions = sessionRepository.items.filter(
      (session) => session.orgId === "org-1",
    );
    const org2Session = sessionRepository.items.find(
      (session) => session.orgId === "org-2",
    );
    expect(org1Sessions.every((session) => session.revokedAt !== null)).toBe(
      true,
    );
    expect(org2Session?.revokedAt).toBeNull();
  });
});
