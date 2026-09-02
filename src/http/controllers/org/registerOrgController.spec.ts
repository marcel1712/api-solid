import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";

function randomWhatsapp() {
  return `+551199${Math.floor(1000000 + Math.random() * 8999999)}`;
}

describe("Register Org Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to register an org", async () => {
    await app.ready();

    const email = `${randomUUID()}@email.com`;

    const response = await app.inject({
      method: "POST",
      url: "/org",
      payload: {
        name: "Pet Friends",
        email,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "São Carlos",
        address: "Rua das Flores, 900",
      },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: "Pet Friends",
        email,
        token: expect.any(String),
      }),
    );
    expect(response.json()).not.toHaveProperty("org");
    expect(response.json()).not.toHaveProperty("password_hash");
  });

  it("should set a refreshToken cookie when registering an org", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/org",
      payload: {
        name: "Pet Friends",
        email: `${randomUUID()}@email.com`,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "São Carlos",
        address: "Rua das Flores, 900",
      },
    });

    const cookies = response.cookies;
    const refreshTokenCookie = cookies.find(
      (cookie) => cookie.name === "refreshToken",
    );

    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie?.httpOnly).toBe(true);
  });

  it("should not be able to register an org with an already registered email", async () => {
    await app.ready();

    const email = `${randomUUID()}@email.com`;

    await app.inject({
      method: "POST",
      url: "/org",
      payload: {
        name: "Pet Friends",
        email,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "São Carlos",
        address: "Rua das Flores, 900",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/org",
      payload: {
        name: "Other Pet Friends",
        email,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "Rio de Janeiro",
        address: "Rua das Palmeiras, 456",
      },
    });

    expect(response.statusCode).toEqual(409);
  });
});
