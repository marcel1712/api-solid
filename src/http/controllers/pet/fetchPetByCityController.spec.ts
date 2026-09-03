import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";

const PAGE_SIZE = 20;

function randomWhatsapp() {
  return `+551199${Math.floor(1000000 + Math.random() * 8999999)}`;
}

async function createOrg(city: string) {
  const response = await app.inject({
    method: "POST",
    url: "/org",
    payload: {
      name: "Pet Friends",
      email: `${randomUUID()}@email.com`,
      password: "password123",
      whatsapp: randomWhatsapp(),
      city,
      address: "Rua das Flores, 900",
    },
  });

  return response.json();
}

async function createPet(orgId: string, overrides: Record<string, unknown> = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/pets",
    payload: {
      name: "Nick",
      orgId,
      age: 2,
      size: "Small",
      type: "Dog",
      bio: "A very good boy",
      ...overrides,
    },
  });

  return response.json();
}

describe("Fetch Pet By City Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to list pets from a city", async () => {
    await app.ready();

    const city = `São Carlos ${randomUUID()}`;
    const org = await createOrg(city);
    const pet = await createPet(org.id);

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city, page: "1" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual([
      expect.objectContaining({ id: pet.id, name: "Nick" }),
    ]);
  });

  it("should not return pets from a different city", async () => {
    await app.ready();

    const cityA = `São Carlos ${randomUUID()}`;
    const cityB = `Curitiba ${randomUUID()}`;
    const orgA = await createOrg(cityA);
    const orgB = await createOrg(cityB);
    await createPet(orgA.id, { name: "Nick" });
    await createPet(orgB.id, { name: "Mimi" });

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: cityA, page: "1" },
    });

    expect(response.statusCode).toEqual(200);
    const names = response.json().map((pet: { name: string }) => pet.name);
    expect(names).toEqual(["Nick"]);
  });

  it("should be able to filter pets by size and type", async () => {
    await app.ready();

    const city = `Rio de Janeiro ${randomUUID()}`;
    const org = await createOrg(city);
    await createPet(org.id, { size: "Small", type: "Dog" });
    const largeCat = await createPet(org.id, { size: "Large", type: "Cat" });

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city, page: "1", size: "Large", type: "Cat" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual([
      expect.objectContaining({ id: largeCat.id, size: "Large", type: "Cat" }),
    ]);
  });

  it("should be able to filter pets by age", async () => {
    await app.ready();

    const city = `Belo Horizonte ${randomUUID()}`;
    const org = await createOrg(city);
    const puppy = await createPet(org.id, { age: 1 });
    await createPet(org.id, { age: 8 });

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city, page: "1", age: "1" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual([
      expect.objectContaining({ id: puppy.id, age: 1 }),
    ]);
  });

  it("should return an empty list when there are no pets in the city", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: `Cidade Inexistente ${randomUUID()}`, page: "1" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual([]);
  });

  it("should respect the page size and paginate results", async () => {
    await app.ready();

    const city = `Curitiba ${randomUUID()}`;
    const org = await createOrg(city);

    for (let i = 0; i < PAGE_SIZE + 1; i++) {
      await createPet(org.id, { name: `Pet ${i}` });
    }

    const firstPage = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city, page: "1" },
    });

    const secondPage = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city, page: "2" },
    });

    expect(firstPage.statusCode).toEqual(200);
    expect(firstPage.json()).toHaveLength(PAGE_SIZE);

    expect(secondPage.statusCode).toEqual(200);
    expect(secondPage.json()).toHaveLength(1);

    const firstPageIds = firstPage.json().map((pet: { id: string }) => pet.id);
    const secondPageIds = secondPage
      .json()
      .map((pet: { id: string }) => pet.id);
    expect(firstPageIds).not.toEqual(expect.arrayContaining(secondPageIds));
  });

  it("should return an empty list for a page beyond the available results", async () => {
    await app.ready();

    const city = `Curitiba ${randomUUID()}`;
    const org = await createOrg(city);
    await createPet(org.id);

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city, page: "2" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual([]);
  });

  it("should not be able to search without a city", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { page: "1" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to search with an empty city", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: "", page: "1" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to search with an invalid size", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: "São Carlos", page: "1", size: "Huge" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to search with an invalid type", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: "São Carlos", page: "1", type: "Dragon" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to search without a page", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: "São Carlos" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to search with page zero", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: "São Carlos", page: "0" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to search with a negative page", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: "São Carlos", page: "-1" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to search with a non-numeric page", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/pets/search",
      query: { city: "São Carlos", page: "abc" },
    });

    expect(response.statusCode).toEqual(400);
  });
});
