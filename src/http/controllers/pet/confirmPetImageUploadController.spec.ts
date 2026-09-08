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

async function requestUploadUrl(token: string, petId: string) {
  const response = await app.inject({
    method: "POST",
    url: `/pets/${petId}/images`,
    headers: { authorization: `Bearer ${token}` },
    payload: { contentType: "image/jpeg" },
  });

  return response.json();
}

describe("Confirm Pet Image Upload Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to confirm an image after uploading it", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);
    const { key, uploadUrl } = await requestUploadUrl(org.token, pet.id);

    await fetch(uploadUrl, {
      method: "PUT",
      body: Buffer.from("fake-image-bytes"),
      headers: { "Content-Type": "image/jpeg" },
    });

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images/confirm`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { key },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json()).toEqual(
      expect.objectContaining({ petId: pet.id, key }),
    );
  });

  it("should not be able to confirm an upload that was never sent to storage", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);
    const { key } = await requestUploadUrl(org.token, pet.id);

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images/confirm`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { key },
    });

    expect(response.statusCode).toEqual(404);
  });

  it("should not be able to confirm a key from another pet", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);
    const otherPet = await createPet(org.token);
    const { key, uploadUrl } = await requestUploadUrl(org.token, otherPet.id);

    await fetch(uploadUrl, {
      method: "PUT",
      body: Buffer.from("fake-image-bytes"),
      headers: { "Content-Type": "image/jpeg" },
    });

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images/confirm`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { key },
    });

    expect(response.statusCode).toEqual(403);
  });

  it("should not be able to confirm an upload for another org's pet", async () => {
    await app.ready();

    const owner = await createOrg();
    const pet = await createPet(owner.token);
    const { key } = await requestUploadUrl(owner.token, pet.id);
    const otherOrg = await createOrg();

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images/confirm`,
      headers: { authorization: `Bearer ${otherOrg.token}` },
      payload: { key },
    });

    expect(response.statusCode).toEqual(403);
  });

  it("should not be able to confirm an upload without authentication", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);
    const { key } = await requestUploadUrl(org.token, pet.id);

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images/confirm`,
      payload: { key },
    });

    expect(response.statusCode).toEqual(401);
  });
});
