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

describe("Update Pet Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to update the pet's mutable information", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { name: "Nick Jr.", age: 3 },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual(
      expect.objectContaining({ id: pet.id, name: "Nick Jr.", age: 3 }),
    );
  });

  it("should not be able to change the pet's adoption status through this route", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { adopted: true },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json().adopted).toEqual(false);
  });

  it("should not be able to update a non-existing pet", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${randomUUID()}`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { name: "Nick Jr." },
    });

    expect(response.statusCode).toEqual(404);
  });

  it("should not be able to update another org's pet", async () => {
    await app.ready();

    const owner = await createOrg();
    const pet = await createPet(owner.token);

    const otherOrg = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}`,
      headers: { authorization: `Bearer ${otherOrg.token}` },
      payload: { name: "Nick Jr." },
    });

    expect(response.statusCode).toEqual(403);
  });

  it("should not be able to update a pet without authentication", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "PATCH",
      url: `/pets/${pet.id}`,
      payload: { name: "Nick Jr." },
    });

    expect(response.statusCode).toEqual(401);
  });

  it("should not be able to update a pet with an invalid id", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "PATCH",
      url: "/pets/not-a-uuid",
      headers: { authorization: `Bearer ${org.token}` },
      payload: { name: "Nick Jr." },
    });

    expect(response.statusCode).toEqual(400);
  });
});
