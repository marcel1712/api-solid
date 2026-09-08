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

async function createPet(token: string, overrides: Record<string, unknown> = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/pets",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      name: "Nick",
      age: 2,
      size: "Small",
      type: "Dog",
      bio: "A very good boy",
      ...overrides,
    },
  });

  return response.json();
}

describe("Get Org Pets Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to list the authenticated org's pets", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "GET",
      url: "/orgs/me/pets",
      headers: { authorization: `Bearer ${org.token}` },
      query: { page: "1" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual([
      expect.objectContaining({ id: pet.id }),
    ]);
  });

  it("should not return pets from other orgs", async () => {
    await app.ready();

    const org = await createOrg();
    const otherOrg = await createOrg();
    await createPet(otherOrg.token);

    const response = await app.inject({
      method: "GET",
      url: "/orgs/me/pets",
      headers: { authorization: `Bearer ${org.token}` },
      query: { page: "1" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual([]);
  });

  it("should include already adopted pets", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}/adopt`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { adopted: true },
    });

    const response = await app.inject({
      method: "GET",
      url: "/orgs/me/pets",
      headers: { authorization: `Bearer ${org.token}` },
      query: { page: "1" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual([
      expect.objectContaining({ id: pet.id, adopted: true }),
    ]);
  });

  it("should not be able to list pets without authentication", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/orgs/me/pets",
      query: { page: "1" },
    });

    expect(response.statusCode).toEqual(401);
  });

  it("should not be able to list pets without a page", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "GET",
      url: "/orgs/me/pets",
      headers: { authorization: `Bearer ${org.token}` },
    });

    expect(response.statusCode).toEqual(400);
  });
});
