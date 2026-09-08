import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";
import { prisma } from "@/lib/prisma";

function randomWhatsapp() {
  return `+551199${Math.floor(1000000 + Math.random() * 8999999)}`;
}

async function createOrg() {
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
    },
  });

  const org = response.json();
  await prisma.org.update({
    where: { id: org.id },
    data: { emailVerifiedAt: new Date() },
  });

  return org;
}

describe("Update Org Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to update the org's own information", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/orgs/${org.id}`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { name: "New Pet Friends", city: "Campinas" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual(
      expect.objectContaining({ name: "New Pet Friends", city: "Campinas" }),
    );
  });

  it("should not expose the password hash in the response", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/orgs/${org.id}`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { name: "New Pet Friends" },
    });

    expect(response.json()).not.toHaveProperty("password_hash");
  });

  it("should not be able to change the password through this route", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/orgs/${org.id}`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { password: "new-password" },
    });

    expect(response.statusCode).toEqual(200);

    const loginResponse = await app.inject({
      method: "POST",
      url: "/orgs/sessions",
      payload: { email: org.email, password: "password123" },
    });

    expect(loginResponse.statusCode).toEqual(200);
  });

  it("should not be able to update a non-existing org", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/orgs/${randomUUID()}`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { name: "New Pet Friends" },
    });

    expect(response.statusCode).toEqual(404);
  });

  it("should not be able to update another org's information", async () => {
    await app.ready();

    const org = await createOrg();
    const otherOrg = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/orgs/${org.id}`,
      headers: { authorization: `Bearer ${otherOrg.token}` },
      payload: { name: "New Pet Friends" },
    });

    expect(response.statusCode).toEqual(403);
  });

  it("should not be able to update an org without authentication", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/orgs/${org.id}`,
      payload: { name: "New Pet Friends" },
    });

    expect(response.statusCode).toEqual(401);
  });

  it("should not be able to update an org with an invalid id", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: "/orgs/not-a-uuid",
      headers: { authorization: `Bearer ${org.token}` },
      payload: { name: "New Pet Friends" },
    });

    expect(response.statusCode).toEqual(400);
  });
});
