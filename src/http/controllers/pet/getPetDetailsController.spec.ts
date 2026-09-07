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

async function createPet(token: string) {
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
    },
  });

  return response.json();
}

describe("Get Pet Details Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to get pet details, including the org's whatsapp", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "GET",
      url: `/pets/${pet.id}`,
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: pet.id,
        name: "Nick",
        orgId: org.id,
        whatsapp: org.whatsapp,
      }),
    );
  });

  it("should not expose the org's password hash through pet details", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "GET",
      url: `/pets/${pet.id}`,
    });

    expect(response.json()).not.toHaveProperty("password_hash");
  });

  it("should not require authentication to get pet details", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "GET",
      url: `/pets/${pet.id}`,
    });

    expect(response.statusCode).toEqual(200);
  });

  it("should return 404 for a non-existing pet", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: `/pets/${randomUUID()}`,
    });

    expect(response.statusCode).toEqual(404);
  });

  it("should return 400 for an invalid pet id", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/not-a-uuid",
    });

    expect(response.statusCode).toEqual(400);
  });
});
