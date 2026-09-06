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

describe("Mark Pet As Adopted Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to mark a pet as adopted", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}/adopt`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { adopted: true },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual({
      adoptedPet: expect.objectContaining({ id: pet.id, adopted: true }),
    });
  });

  it("should be able to revert a pet's adoption status", async () => {
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
      method: "PATCH",
      url: `/pets/${pet.id}/adopt`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { adopted: false },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual({
      adoptedPet: expect.objectContaining({ id: pet.id, adopted: false }),
    });
  });

  it("should not be able to mark a non-existing pet as adopted", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${randomUUID()}/adopt`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { adopted: true },
    });

    expect(response.statusCode).toEqual(404);
    expect(response.json()).toEqual({ message: expect.any(String) });
  });

  it("should not be able to mark a pet as adopted with an invalid id", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: "/pets/not-a-uuid/adopt",
      headers: { authorization: `Bearer ${org.token}` },
      payload: { adopted: true },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to mark a pet as adopted without the adopted field", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}/adopt`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: {},
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to mark another org's pet as adopted", async () => {
    await app.ready();

    const owner = await createOrg();
    const pet = await createPet(owner.token);

    const otherOrg = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}/adopt`,
      headers: { authorization: `Bearer ${otherOrg.token}` },
      payload: { adopted: true },
    });

    expect(response.statusCode).toEqual(403);
  });

  it("should not be able to mark a pet as adopted without authentication", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}/adopt`,
      payload: { adopted: true },
    });

    expect(response.statusCode).toEqual(401);
  });
});
