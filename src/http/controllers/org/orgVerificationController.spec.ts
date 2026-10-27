import { CURRENT_TERMS_VERSION } from "@/utils/terms";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { randomCnpj } from "@/test/random-cnpj";
import { UNKNOWN_CNPJ } from "@/test/setup-cnpj-lookup-mock";
import { signInRegisteredOrg } from "@/test/sign-in-registered-org";

const ADMIN_EMAIL = "admin@tailhop.test";

function signup(overrides: Record<string, unknown> = {}) {
  return app.inject({
    method: "POST",
    url: "/orgs",
    payload: {
      name: "Pet Friends",
      email: `${randomUUID()}@email.com`,
      password: "password123",
      whatsapp: `+551199${Math.floor(1000000 + Math.random() * 8999999)}`,
      city: "São Carlos",
      address: "Rua das Flores, 900",
      cnpj: randomCnpj(),
      termsVersion: CURRENT_TERMS_VERSION,
      ...overrides,
    },
  });
}

async function pendingOrg() {
  const response = await signup();
  return signInRegisteredOrg(app, response.json(), { approved: false });
}

// Specs share one database, so the admin account is created once and reused.
async function adminToken() {
  const existing = await prisma.org.findUnique({ where: { email: ADMIN_EMAIL } });
  const admin: { id: string; email: string } =
    existing ?? (await signup({ email: ADMIN_EMAIL })).json();
  return (await signInRegisteredOrg(app, admin)).token;
}

async function putUnderReview(orgId: string) {
  await prisma.org.update({
    where: { id: orgId },
    data: { status: "UnderReview" },
  });
}

describe("Org verification (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  describe("signup", () => {
    it("should accept a formatted CNPJ and start pending", async () => {
      await app.ready();

      const cnpj = randomCnpj();
      const formatted = `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;

      const response = await signup({ cnpj: formatted });

      expect(response.statusCode).toEqual(201);
      expect(response.json()).toEqual(
        expect.objectContaining({ cnpj, status: "Pending" }),
      );
      expect(response.json()).not.toHaveProperty("cnpjCheck");
    });

    it("should refuse an invalid CNPJ", async () => {
      await app.ready();

      const response = await signup({ cnpj: "12345678000100" });

      expect(response.statusCode).toEqual(400);
    });

    it("should refuse a CNPJ unknown to the Receita", async () => {
      await app.ready();

      const response = await signup({ cnpj: UNKNOWN_CNPJ });

      expect(response.statusCode).toEqual(422);
      expect(response.json().code).toEqual("CNPJ_NOT_FOUND");
    });

    it("should refuse a CNPJ already registered", async () => {
      await app.ready();

      const cnpj = randomCnpj();
      await signup({ cnpj });
      const response = await signup({ cnpj });

      expect(response.statusCode).toEqual(409);
    });
  });

  describe("own org", () => {
    it("should show the org its own status and documents", async () => {
      await app.ready();

      const org = await pendingOrg();

      const response = await app.inject({
        method: "GET",
        url: "/orgs/me",
        headers: { authorization: `Bearer ${org.token}` },
      });

      expect(response.statusCode).toEqual(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          id: org.id,
          status: "Pending",
          documents: [],
          isAdmin: false,
        }),
      );
      expect(response.json()).not.toHaveProperty("password_hash");
      expect(response.json()).not.toHaveProperty("cnpjCheck");
    });

    it("should hand out an upload URL bound to the file's type and size", async () => {
      await app.ready();

      const org = await pendingOrg();

      const response = await app.inject({
        method: "POST",
        url: "/orgs/me/documents",
        headers: { authorization: `Bearer ${org.token}` },
        payload: { kind: "Statute", contentType: "application/pdf", size: 2048 },
      });

      expect(response.statusCode).toEqual(201);
      const { key, uploadUrl } = response.json();
      expect(key).toMatch(new RegExp(`^orgs/${org.id}/Statute-.+\\.pdf$`));
      const signedHeaders = new URL(uploadUrl).searchParams.get(
        "X-Amz-SignedHeaders",
      );
      expect(signedHeaders).toContain("content-type");
      expect(signedHeaders).toContain("content-length");
    });

    it("should refuse other file types and files over 10 MB", async () => {
      await app.ready();

      const org = await pendingOrg();
      const headers = { authorization: `Bearer ${org.token}` };

      const wrongType = await app.inject({
        method: "POST",
        url: "/orgs/me/documents",
        headers,
        payload: { kind: "Statute", contentType: "image/gif", size: 2048 },
      });
      const tooBig = await app.inject({
        method: "POST",
        url: "/orgs/me/documents",
        headers,
        payload: {
          kind: "Statute",
          contentType: "application/pdf",
          size: 10 * 1024 * 1024 + 1,
        },
      });

      expect(wrongType.statusCode).toEqual(400);
      expect(tooBig.statusCode).toEqual(400);
    });
  });

  describe("visibility", () => {
    it("should keep a pending org's pet off public pages but show it to the org", async () => {
      await app.ready();

      const org = await pendingOrg();
      const pet = (
        await app.inject({
          method: "POST",
          url: "/pets",
          headers: { authorization: `Bearer ${org.token}` },
          payload: { name: "Nick", age: 2, size: "Small", type: "Dog" },
        })
      ).json();

      const anonymous = await app.inject({ method: "GET", url: `/pets/${pet.id}` });
      const owner = await app.inject({
        method: "GET",
        url: `/pets/${pet.id}`,
        headers: { authorization: `Bearer ${org.token}` },
      });
      const search = await app.inject({
        method: "GET",
        url: "/pets/search?city=São Carlos&page=1",
      });

      expect(anonymous.statusCode).toEqual(404);
      expect(owner.statusCode).toEqual(200);
      // The owner's view includes a draft: no cache may keep it for others.
      expect(owner.headers["cache-control"]).toEqual("private, no-store");
      expect(search.headers["cache-control"]).toContain("public");
      expect(
        search.json().some((item: { id: string }) => item.id === pet.id),
      ).toBe(false);
    });
  });

  describe("admin", () => {
    it("should refuse anyone not on the admin list", async () => {
      await app.ready();

      const org = await pendingOrg();

      const response = await app.inject({
        method: "GET",
        url: "/admin/orgs",
        headers: { authorization: `Bearer ${org.token}` },
      });

      expect(response.statusCode).toEqual(403);
    });

    it("should tell the admin they are one", async () => {
      await app.ready();

      const token = await adminToken();

      const response = await app.inject({
        method: "GET",
        url: "/orgs/me",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.json().isAdmin).toBe(true);
    });

    it("should list orgs under review with their CNPJ check", async () => {
      await app.ready();

      const token = await adminToken();
      const org = await pendingOrg();
      await putUnderReview(org.id);

      const response = await app.inject({
        method: "GET",
        url: "/admin/orgs",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toEqual(200);
      const listed = response
        .json()
        .find((item: { id: string }) => item.id === org.id);
      expect(listed.cnpjCheck.flags).toEqual({
        active: true,
        nonProfit: true,
        cityMatches: true,
      });
      expect(listed.documents).toEqual([]);
      expect(listed).not.toHaveProperty("password_hash");
    });

    it("should approve an org and put its pets on the search", async () => {
      await app.ready();

      const token = await adminToken();
      const org = await pendingOrg();
      const pet = (
        await app.inject({
          method: "POST",
          url: "/pets",
          headers: { authorization: `Bearer ${org.token}` },
          payload: { name: "Nick", age: 2, size: "Small", type: "Dog" },
        })
      ).json();
      await putUnderReview(org.id);

      const response = await app.inject({
        method: "POST",
        url: `/admin/orgs/${org.id}/review`,
        headers: { authorization: `Bearer ${token}` },
        payload: { decision: "approve" },
      });

      expect(response.statusCode).toEqual(200);
      expect(response.json().status).toEqual("Approved");

      const publicPet = await app.inject({ method: "GET", url: `/pets/${pet.id}` });
      expect(publicPet.statusCode).toEqual(200);
    });

    it("should require a reason to reject", async () => {
      await app.ready();

      const token = await adminToken();
      const org = await pendingOrg();
      await putUnderReview(org.id);

      const withoutReason = await app.inject({
        method: "POST",
        url: `/admin/orgs/${org.id}/review`,
        headers: { authorization: `Bearer ${token}` },
        payload: { decision: "reject" },
      });
      const withReason = await app.inject({
        method: "POST",
        url: `/admin/orgs/${org.id}/review`,
        headers: { authorization: `Bearer ${token}` },
        payload: { decision: "reject", reason: "A ata enviada não está legível." },
      });

      expect(withoutReason.statusCode).toEqual(400);
      expect(withReason.statusCode).toEqual(200);
      expect(withReason.json()).toEqual(
        expect.objectContaining({
          status: "Rejected",
          rejectionReason: "A ata enviada não está legível.",
        }),
      );
    });
  });
});
