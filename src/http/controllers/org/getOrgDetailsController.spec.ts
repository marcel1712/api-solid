import { CURRENT_TERMS_VERSION } from "@/utils/terms";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";
import { randomCnpj } from "@/test/random-cnpj";
import { prisma } from "@/lib/prisma";

function randomWhatsapp() {
  return `+551199${Math.floor(1000000 + Math.random() * 8999999)}`;
}

async function createOrg({ approved = true } = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/orgs",
    payload: {
      name: "Pet Friends",
      email: `${randomUUID()}@email.com`,
      password: "password123",
      whatsapp: randomWhatsapp(),
      city: "São Carlos",
      address: "Rua das Flores, 900",
      cnpj: randomCnpj(),
      termsVersion: CURRENT_TERMS_VERSION,
    },
  });

  const org = response.json();
  if (approved) {
    await prisma.org.update({
      where: { id: org.id },
      data: { status: "Approved" },
    });
  }
  return org;
}

describe("Get Org Details Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to get org details", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "GET",
      url: `/orgs/${org.id}`,
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: org.id,
        name: "Pet Friends",
        whatsapp: org.whatsapp,
        city: "São Carlos",
        address: "Rua das Flores, 900",
      }),
    );
  });

  it("should only expose the public profile", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "GET",
      url: `/orgs/${org.id}`,
    });

    for (const field of ["password_hash", "email", "cnpj", "cnpjCheck", "status"]) {
      expect(response.json()).not.toHaveProperty(field);
    }
  });

  it("should not show an org that wasn't approved", async () => {
    await app.ready();

    const org = await createOrg({ approved: false });

    const response = await app.inject({
      method: "GET",
      url: `/orgs/${org.id}`,
    });

    expect(response.statusCode).toEqual(404);
  });

  it("should not require authentication to get org details", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "GET",
      url: `/orgs/${org.id}`,
    });

    expect(response.statusCode).toEqual(200);
  });

  it("should return 404 for a non-existing org", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: `/orgs/${randomUUID()}`,
    });

    expect(response.statusCode).toEqual(404);
  });

  it("should return 400 for an invalid org id", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/orgs/not-a-uuid",
    });

    expect(response.statusCode).toEqual(400);
  });
});
