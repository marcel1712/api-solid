import { ACCEPTED_TERMS_VERSIONS, CURRENT_TERMS_VERSION } from "@/utils/terms";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { randomCnpj } from "@/test/random-cnpj";

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
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "São Carlos",
        address: "Rua das Flores, 900",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: "Pet Friends",
        email,
      }),
    );
    expect(response.json()).not.toHaveProperty("token");
    expect(response.json()).not.toHaveProperty("org");
    expect(response.json()).not.toHaveProperty("password_hash");
  });

  it("should not open a session when registering an org", async () => {
    await app.ready();

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
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    const cookies = response.cookies;
    const refreshTokenCookie = cookies.find(
      (cookie) => cookie.name === "refreshToken",
    );

    expect(refreshTokenCookie).toBeUndefined();
  });

  it("should not be able to register an org with an already registered email", async () => {
    await app.ready();

    const email = `${randomUUID()}@email.com`;

    await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "São Carlos",
        address: "Rua das Flores, 900",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Other Pet Friends",
        email,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "Rio de Janeiro",
        address: "Rua das Palmeiras, 456",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    expect(response.statusCode).toEqual(409);
  });

  it("should not be able to register an org with an already registered whatsapp", async () => {
    await app.ready();

    const whatsapp = randomWhatsapp();

    await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email: `${randomUUID()}@email.com`,
        password: "password123",
        whatsapp,
        city: "São Carlos",
        address: "Rua das Flores, 900",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Other Pet Friends",
        email: `${randomUUID()}@email.com`,
        password: "password123",
        whatsapp,
        city: "Rio de Janeiro",
        address: "Rua das Palmeiras, 456",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    expect(response.statusCode).toEqual(409);
  });

  it("should record which terms version was accepted, and when", async () => {
    await app.ready();

    const email = `${randomUUID()}@email.com`;
    await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "São Carlos",
        address: "Rua das Flores, 900",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    const org = await prisma.org.findUnique({ where: { email } });
    expect(org?.termsVersion).toEqual(CURRENT_TERMS_VERSION);
    expect(org?.termsAcceptedAt).toBeInstanceOf(Date);
  });

  it("should still accept the previous terms version during a rollout", async () => {
    await app.ready();

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
        cnpj: randomCnpj(),
        termsVersion: ACCEPTED_TERMS_VERSIONS[1],
      },
    });

    expect(response.statusCode).toEqual(201);
  });

  it("should not register without accepting the current terms", async () => {
    await app.ready();

    const payload = {
      name: "Pet Friends",
      password: "password123",
      city: "São Carlos",
      address: "Rua das Flores, 900",
    };

    const missing = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        ...payload,
        email: `${randomUUID()}@email.com`,
        whatsapp: randomWhatsapp(),
        cnpj: randomCnpj(),
      },
    });
    const outdated = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        ...payload,
        email: `${randomUUID()}@email.com`,
        whatsapp: randomWhatsapp(),
        cnpj: randomCnpj(),
        termsVersion: "2020-01-01",
      },
    });

    expect(missing.statusCode).toEqual(400);
    expect(outdated.statusCode).toEqual(400);
  });

  it("should not be able to register an org without an address", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email: `${randomUUID()}@email.com`,
        password: "password123",
        whatsapp: randomWhatsapp(),
        city: "São Carlos",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to register an org without a whatsapp number", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email: `${randomUUID()}@email.com`,
        password: "password123",
        city: "São Carlos",
        address: "Rua das Flores, 900",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to register an org with a malformed whatsapp number", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email: `${randomUUID()}@email.com`,
        password: "password123",
        whatsapp: "not-a-phone-number",
        city: "São Carlos",
        address: "Rua das Flores, 900",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should be able to register with a bare local whatsapp number (auto-prefixed to +55)", async () => {
    await app.ready();

    const localNumber = `1198${Math.floor(1000000 + Math.random() * 8999999)}`;

    const response = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email: `${randomUUID()}@email.com`,
        password: "password123",
        whatsapp: localNumber,
        city: "São Carlos",
        address: "Rua das Flores, 900",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json().whatsapp).toEqual(`+55${localNumber}`);
  });

  it("should be able to register with a formatted local whatsapp number", async () => {
    await app.ready();

    const digits = `1198${Math.floor(1000000 + Math.random() * 8999999)}`;
    const formatted = `(11) ${digits.slice(2, 7)}-${digits.slice(7)}`;

    const response = await app.inject({
      method: "POST",
      url: "/orgs",
      payload: {
        name: "Pet Friends",
        email: `${randomUUID()}@email.com`,
        password: "password123",
        whatsapp: formatted,
        city: "São Carlos",
        address: "Rua das Flores, 900",
        cnpj: randomCnpj(),
        termsVersion: CURRENT_TERMS_VERSION,
      },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json().whatsapp).toEqual(`+55${digits}`);
  });
});
