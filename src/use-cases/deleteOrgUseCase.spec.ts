import { describe, it, beforeEach, expect, vi } from "vitest";
import { CURRENT_TERMS_VERSION } from "@/utils/terms";
import { InMemoryOrgRepository } from "@/repositories/in-memory/in-memory-org-repository";
import { InMemoryOrgDocumentRepository } from "@/repositories/in-memory/in-memory-org-document-repository";
import { InMemoryPetRepository } from "@/repositories/in-memory/in-memory-pet-repository";
import { InMemoryPetImageRepository } from "@/repositories/in-memory/in-memory-pet-image-repository";
import { InMemorySessionRepository } from "@/repositories/in-memory/in-memory-session-repository";
import { InMemoryPasswordResetTokenRepository } from "@/repositories/in-memory/in-memory-password-reset-token-repository";
import { InMemoryEmailVerificationTokenRepository } from "@/repositories/in-memory/in-memory-email-verification-token-repository";
import { InMemoryBlockedContactRepository } from "@/repositories/in-memory/in-memory-blocked-contact-repository";
import { FakeDocumentStorage } from "@/test/fake-document-storage";
import { DeleteOrgUseCase } from "./deleteOrgUseCase";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

const sendMock = vi.fn().mockResolvedValue({});

vi.mock("@/lib/r2", () => ({
  r2: { send: (...args: unknown[]) => sendMock(...args) },
}));

let orgRepository: InMemoryOrgRepository;
let orgDocumentRepository: InMemoryOrgDocumentRepository;
let petRepository: InMemoryPetRepository;
let petImageRepository: InMemoryPetImageRepository;
let sessionRepository: InMemorySessionRepository;
let passwordResetTokenRepository: InMemoryPasswordResetTokenRepository;
let emailVerificationTokenRepository: InMemoryEmailVerificationTokenRepository;
let blockedContactRepository: InMemoryBlockedContactRepository;
let documentStorage: FakeDocumentStorage;
let sut: DeleteOrgUseCase;

async function createOrg() {
  return orgRepository.create({
    name: "Fake Org",
    email: "fake@org.com",
    password_hash: "hash",
    whatsapp: "11999999999",
    city: "Jau",
    address: "Rua X, 1",
    cnpj: "11222333000181",
    termsVersion: CURRENT_TERMS_VERSION,
    termsAcceptedAt: new Date(),
  });
}

describe("Delete Org Use Case", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    orgDocumentRepository = new InMemoryOrgDocumentRepository();
    petRepository = new InMemoryPetRepository();
    petImageRepository = new InMemoryPetImageRepository();
    sessionRepository = new InMemorySessionRepository();
    passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
    emailVerificationTokenRepository =
      new InMemoryEmailVerificationTokenRepository();
    blockedContactRepository = new InMemoryBlockedContactRepository();
    documentStorage = new FakeDocumentStorage();
    sut = new DeleteOrgUseCase(
      orgRepository,
      orgDocumentRepository,
      petRepository,
      petImageRepository,
      sessionRepository,
      passwordResetTokenRepository,
      emailVerificationTokenRepository,
      blockedContactRepository,
      documentStorage,
    );
    sendMock.mockClear();
  });

  it("should delete the org and everything that belongs to it", async () => {
    const org = await createOrg();
    await orgDocumentRepository.save({
      orgId: org.id,
      kind: "Statute",
      key: "docs/statute.pdf",
    });
    documentStorage.objects.set("docs/statute.pdf", 100);
    const pet = await petRepository.create({
      name: "Rex",
      age: 2,
      size: "Medium",
      type: "Dog",
      org: { connect: { id: org.id } },
    });
    await petImageRepository.create({
      petId: pet.id,
      key: "pets/rex.jpg",
      url: "https://example.com/pets/rex.jpg",
    });
    await sessionRepository.create({
      orgId: org.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 1000 * 60),
    });
    await passwordResetTokenRepository.create({
      orgId: org.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 1000 * 60),
    });
    await emailVerificationTokenRepository.create({
      orgId: org.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    await sut.execute({ orgId: org.id, reason: "Fake CNPJ, no documents" });

    expect(orgRepository.items).toHaveLength(0);
    expect(orgDocumentRepository.items).toHaveLength(0);
    expect(documentStorage.objects.has("docs/statute.pdf")).toBe(false);
    expect(petRepository.items).toHaveLength(0);
    expect(petImageRepository.items).toHaveLength(0);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sessionRepository.items).toHaveLength(0);
    expect(passwordResetTokenRepository.items).toHaveLength(0);
    expect(emailVerificationTokenRepository.items).toHaveLength(0);
  });

  it("should block the org's email and WhatsApp from registering again", async () => {
    const org = await createOrg();

    await sut.execute({ orgId: org.id, reason: "Fake CNPJ, no documents" });

    await expect(
      blockedContactRepository.existsEmailOrWhatsapp(
        org.email,
        org.whatsapp,
      ),
    ).resolves.toBe(true);
  });

  it("should not be able to delete a non-existing org", async () => {
    await expect(() =>
      sut.execute({ orgId: "non-existing-org-id", reason: "test reason" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
