import { describe, it, beforeEach, expect } from "vitest";
import { InMemorySessionRepository } from "../repositories/in-memory/in-memory-session-repository";
import { CreateSessionUseCase } from "./createSessionUseCase";
import { RevokeSessionUseCase } from "./revokeSessionUseCase";

let sessionRepository: InMemorySessionRepository;
let sut: RevokeSessionUseCase;

describe("Revoke Session Use Case", () => {
  beforeEach(() => {
    sessionRepository = new InMemorySessionRepository();
    sut = new RevokeSessionUseCase(sessionRepository);
  });

  it("should revoke the session", async () => {
    const { refreshToken } = await new CreateSessionUseCase(
      sessionRepository,
    ).execute({ orgId: "org-1" });

    await sut.execute({ refreshToken });

    expect(sessionRepository.items[0].revokedAt).not.toBeNull();
  });

  it("should not fail with an unknown token", async () => {
    await expect(sut.execute({ refreshToken: "unknown" })).resolves.toBe(
      undefined,
    );
  });
});
