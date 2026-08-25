import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";

async function createOrg() {
  const whatsapp = `+551199${Math.floor(1000000 + Math.random() * 8999999)}`;

  const response = await app.inject({
    method: "POST",
    url: "/org",
    payload: {
      name: "Pet Friends",
      email: `${randomUUID()}@email.com`,
      password: "password123",
      whatsapp,
      city: "São Carlos",
      address: "Rua das Flores, 900",
    },
  });

  return response.json();
}

describe("Register Pet Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to register a pet", async () => {
    await app.ready();

    const org = await createOrg();

    const response = await app.inject({
      method: "POST",
      url: "/pets",
      payload: {
        name: "Nick",
        orgId: org.id,
        age: 2,
        size: "Small",
        type: "Dog",
        bio: "A very good boy",
      },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json()).toEqual(
      expect.objectContaining({
        name: "Nick",
        orgId: org.id,
        age: 2,
        size: "Small",
        type: "Dog",
      }),
    );
  });

  it("should not be able to register a pet for a non-existing org", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/pets",
      payload: {
        name: "Nick",
        orgId: "non-existing-org-id",
        age: 2,
        size: "Small",
        type: "Dog",
        bio: "A very good boy",
      },
    });

    expect(response.statusCode).not.toEqual(201);
  });
});
