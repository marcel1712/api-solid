import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";

function randomWhatsapp() {
  return `+551199${Math.floor(1000000 + Math.random() * 8999999)}`;
}

async function createOrg() {
  const email = `${randomUUID()}@email.com`;
  const password = "password123";

  await app.inject({
    method: "POST",
    url: "/org",
    payload: {
      name: "Pet Friends",
      email,
      password,
      whatsapp: randomWhatsapp(),
      city: "São Carlos",
      address: "Rua das Flores, 900",
    },
  });

  return { email, password };
}

describe("Authenticate Org Controller (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should be able to authenticate with valid credentials", async () => {
    await app.ready();

    const { email, password } = await createOrg();

    const response = await app.inject({
      method: "POST",
      url: "/org/sessions",
      payload: { email, password },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual({ token: expect.any(String) });
  });

  it("should set a refreshToken cookie when authenticating", async () => {
    await app.ready();

    const { email, password } = await createOrg();

    const response = await app.inject({
      method: "POST",
      url: "/org/sessions",
      payload: { email, password },
    });

    const cookies = response.cookies;
    const refreshTokenCookie = cookies.find(
      (cookie) => cookie.name === "refreshToken",
    );

    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie?.httpOnly).toBe(true);
  });

  it("should not be able to authenticate with wrong password", async () => {
    await app.ready();

    const { email } = await createOrg();

    const response = await app.inject({
      method: "POST",
      url: "/org/sessions",
      payload: { email, password: "wrong-password" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to authenticate with a non-existing email", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/org/sessions",
      payload: { email: `${randomUUID()}@email.com`, password: "password123" },
    });

    expect(response.statusCode).toEqual(400);
  });
});
