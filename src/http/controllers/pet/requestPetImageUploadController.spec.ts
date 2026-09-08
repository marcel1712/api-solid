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

describe("Request Pet Image Upload Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to request an image upload url", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { contentType: "image/jpeg" },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        url: expect.stringContaining(pet.id),
        uploadUrl: expect.stringContaining("https://"),
      }),
    );
  });

  it("should not be able to request a 4th image for the same pet", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: "POST",
        url: `/pets/${pet.id}/images`,
        headers: { authorization: `Bearer ${org.token}` },
        payload: { contentType: "image/jpeg" },
      });
    }

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { contentType: "image/jpeg" },
    });

    expect(response.statusCode).toEqual(409);
  });

  it("should not be able to request an upload with an invalid content type", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { contentType: "application/pdf" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to request an upload for another org's pet", async () => {
    await app.ready();

    const owner = await createOrg();
    const pet = await createPet(owner.token);
    const otherOrg = await createOrg();

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images`,
      headers: { authorization: `Bearer ${otherOrg.token}` },
      payload: { contentType: "image/jpeg" },
    });

    expect(response.statusCode).toEqual(403);
  });

  it("should not be able to request an upload without authentication", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images`,
      payload: { contentType: "image/jpeg" },
    });

    expect(response.statusCode).toEqual(401);
  });

  it("should not be able to request an upload for a non-existing pet", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "POST",
      url: `/pets/${randomUUID()}/images`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { contentType: "image/jpeg" },
    });

    expect(response.statusCode).toEqual(404);
  });
});
