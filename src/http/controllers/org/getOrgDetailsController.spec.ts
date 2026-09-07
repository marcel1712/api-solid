import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";

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

  return response.json();
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

  it("should not expose the org's password hash", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "GET",
      url: `/orgs/${org.id}`,
    });

    expect(response.json()).not.toHaveProperty("password_hash");
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
