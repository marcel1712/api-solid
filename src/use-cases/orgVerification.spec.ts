import { CURRENT_TERMS_VERSION } from "@/utils/terms";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryOrgRepository } from "@/repositories/in-memory/in-memory-org-repository";
import { InMemoryOrgDocumentRepository } from "@/repositories/in-memory/in-memory-org-document-repository";
import { FakeCnpjLookup } from "@/test/fake-cnpj-lookup";
import { FakeDocumentStorage } from "@/test/fake-document-storage";
import { randomCnpj } from "@/test/random-cnpj";
import { RegisterOrgUseCase } from "./registerOrg";
import { RequestOrgDocumentUploadUseCase } from "./requestOrgDocumentUploadUseCase";
import { ConfirmOrgDocumentUploadUseCase } from "./confirmOrgDocumentUploadUseCase";
import { ReviewOrgUseCase } from "./reviewOrgUseCase";
import { CnpjNotFoundError } from "./errors/cnpj-not-found-error";
import { ResourceAlreadyExistsError } from "./errors/resource-already-exists-error";
import { NotAllowedError } from "./errors/not-allowed-error";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";
import { CnpjCheck } from "@/utils/cnpj-check";

let orgRepository: InMemoryOrgRepository;
let documentRepository: InMemoryOrgDocumentRepository;
let cnpjLookup: FakeCnpjLookup;
let storage: FakeDocumentStorage;
let register: RegisterOrgUseCase;
let requestUpload: RequestOrgDocumentUploadUseCase;
let confirmUpload: ConfirmOrgDocumentUploadUseCase;
let review: ReviewOrgUseCase;

function signup(cnpj = randomCnpj()) {
  return register.execute({
    name: "Pet Friends",
    email: `org-${Math.random()}@email.com`,
    password: "password123",
    whatsapp: `+5511${Math.floor(900000000 + Math.random() * 99999999)}`,
    city: "São Paulo",
    address: "Rua das Flores, 123",
    cnpj,
    termsVersion: CURRENT_TERMS_VERSION,
  });
}

async function upload(orgId: string, kind: "Statute" | "BoardMinutes") {
  const { key } = await requestUpload.execute({
    orgId,
    kind,
    contentType: "application/pdf",
    size: 1000,
  });
  storage.objects.set(key, 1000);
  return confirmUpload.execute({ orgId, kind, key });
}

describe("Org verification", () => {
  beforeEach(() => {
    orgRepository = new InMemoryOrgRepository();
    documentRepository = new InMemoryOrgDocumentRepository();
    cnpjLookup = new FakeCnpjLookup();
    storage = new FakeDocumentStorage();
    register = new RegisterOrgUseCase(orgRepository, cnpjLookup);
    requestUpload = new RequestOrgDocumentUploadUseCase(orgRepository, storage);
    confirmUpload = new ConfirmOrgDocumentUploadUseCase(
      orgRepository,
      documentRepository,
      storage,
    );
    review = new ReviewOrgUseCase(orgRepository, documentRepository, storage);
  });

  describe("signup", () => {
    it("should start pending, with the CNPJ check saved for the reviewer", async () => {
      const { org } = await signup();

      expect(org.status).toEqual("Pending");
      const check = org.cnpjCheck as unknown as CnpjCheck;
      expect(check.flags).toEqual({
        active: true,
        nonProfit: true,
        cityMatches: true,
      });
    });

    it("should refuse a CNPJ the Receita doesn't know", async () => {
      const cnpj = randomCnpj();
      cnpjLookup.unknown.add(cnpj);

      await expect(signup(cnpj)).rejects.toBeInstanceOf(CnpjNotFoundError);
    });

    it("should refuse a CNPJ already in use", async () => {
      const cnpj = randomCnpj();
      await signup(cnpj);

      await expect(signup(cnpj)).rejects.toBeInstanceOf(
        ResourceAlreadyExistsError,
      );
    });

    it("should still sign up when the lookup itself fails", async () => {
      cnpjLookup.failing = true;

      const { org } = await signup();

      expect(org.status).toEqual("Pending");
      expect(org.cnpjCheck).toBeNull();
    });
  });

  describe("documents", () => {
    it("should move to review once both documents are in", async () => {
      const { org } = await signup();

      const first = await upload(org.id, "Statute");
      expect(first.status).toEqual("Pending");

      const second = await upload(org.id, "BoardMinutes");
      expect(second.status).toEqual("UnderReview");
      expect(second.documents).toHaveLength(2);
    });

    it("should replace a document and delete the old file", async () => {
      const { org } = await signup();
      await upload(org.id, "Statute");
      const [oldKey] = storage.objects.keys();

      await upload(org.id, "Statute");

      expect(storage.objects.has(oldKey)).toBe(false);
      expect(documentRepository.items).toHaveLength(1);
    });

    it("should not confirm a file that never reached the bucket", async () => {
      const { org } = await signup();
      const { key } = await requestUpload.execute({
        orgId: org.id,
        kind: "Statute",
        contentType: "application/pdf",
        size: 1000,
      });

      await expect(
        confirmUpload.execute({ orgId: org.id, kind: "Statute", key }),
      ).rejects.toBeInstanceOf(ResourceNotFoundError);
    });

    it("should not confirm another org's key", async () => {
      const { org } = await signup();
      const { org: other } = await signup();
      const key = `orgs/${other.id}/Statute-x.pdf`;
      storage.objects.set(key, 1000);

      await expect(
        confirmUpload.execute({ orgId: org.id, kind: "Statute", key }),
      ).rejects.toBeInstanceOf(NotAllowedError);
    });

    it("should not change documents while under review", async () => {
      const { org } = await signup();
      await upload(org.id, "Statute");
      await upload(org.id, "BoardMinutes");

      await expect(
        requestUpload.execute({
          orgId: org.id,
          kind: "Statute",
          contentType: "application/pdf",
          size: 1000,
        }),
      ).rejects.toBeInstanceOf(NotAllowedError);
    });
  });

  describe("review", () => {
    async function underReview() {
      const { org } = await signup();
      await upload(org.id, "Statute");
      await upload(org.id, "BoardMinutes");
      return org;
    }

    it("should approve and delete the documents", async () => {
      const org = await underReview();

      const reviewed = await review.execute({
        orgId: org.id,
        decision: "approve",
      });

      expect(reviewed.status).toEqual("Approved");
      expect(reviewed.reviewedAt).toBeInstanceOf(Date);
      expect(storage.objects.size).toEqual(0);
      expect(documentRepository.items).toHaveLength(0);
    });

    it("should reject with a reason, delete the documents and allow a resubmission", async () => {
      const org = await underReview();

      const reviewed = await review.execute({
        orgId: org.id,
        decision: "reject",
        reason: "A ata enviada não está legível.",
      });

      expect(reviewed.status).toEqual("Rejected");
      expect(reviewed.rejectionReason).toEqual("A ata enviada não está legível.");
      expect(storage.objects.size).toEqual(0);

      await upload(org.id, "Statute");
      const again = await upload(org.id, "BoardMinutes");
      expect(again.status).toEqual("UnderReview");
    });

    it("should not review an org that hasn't sent its documents", async () => {
      const { org } = await signup();

      await expect(
        review.execute({ orgId: org.id, decision: "approve" }),
      ).rejects.toBeInstanceOf(NotAllowedError);
    });
  });
});
