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

async function requestImageUpload(token: string, petId: string) {
  const response = await app.inject({
    method: "POST",
    url: `/pets/${petId}/images`,
    headers: { authorization: `Bearer ${token}` },
    payload: { contentType: "image/jpeg" },
  });

  return response.json();
}

describe("Delete Pet Image Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to delete a pet's image", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);
    const image = await requestImageUpload(org.token, pet.id);

    const response = await app.inject({
      method: "DELETE",
      url: `/pets/${pet.id}/images/${image.id}`,
      headers: { authorization: `Bearer ${org.token}` },
    });

    expect(response.statusCode).toEqual(204);
  });

  it("should allow a new image to be requested after deleting one at the limit", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const images = [];
    for (let i = 0; i < 3; i++) {
      images.push(await requestImageUpload(org.token, pet.id));
    }

    await app.inject({
      method: "DELETE",
      url: `/pets/${pet.id}/images/${images[0].id}`,
      headers: { authorization: `Bearer ${org.token}` },
    });

    const response = await app.inject({
      method: "POST",
      url: `/pets/${pet.id}/images`,
      headers: { authorization: `Bearer ${org.token}` },
      payload: { contentType: "image/jpeg" },
    });

    expect(response.statusCode).toEqual(201);
  });

  it("should not be able to delete an image from another org's pet", async () => {
    await app.ready();

    const owner = await createOrg();
    const pet = await createPet(owner.token);
    const image = await requestImageUpload(owner.token, pet.id);
    const otherOrg = await createOrg();

    const response = await app.inject({
      method: "DELETE",
      url: `/pets/${pet.id}/images/${image.id}`,
      headers: { authorization: `Bearer ${otherOrg.token}` },
    });

    expect(response.statusCode).toEqual(403);
  });

  it("should not be able to delete an image without authentication", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);
    const image = await requestImageUpload(org.token, pet.id);

    const response = await app.inject({
      method: "DELETE",
      url: `/pets/${pet.id}/images/${image.id}`,
    });

    expect(response.statusCode).toEqual(401);
  });

  it("should not be able to delete a non-existing image", async () => {
    await app.ready();

    const org = await createOrg();
    const pet = await createPet(org.token);

    const response = await app.inject({
      method: "DELETE",
      url: `/pets/${pet.id}/images/${randomUUID()}`,
      headers: { authorization: `Bearer ${org.token}` },
    });

    expect(response.statusCode).toEqual(404);
  });
});
