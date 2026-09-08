import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import app from "@/app";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn().mockResolvedValue({ data: { id: "email-id" }, error: null }),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

function randomWhatsapp() {
  return `+551199${Math.floor(1000000 + Math.random() * 8999999)}`;
}

async function createOrg() {
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
    },
  });

  return response.json();
}

async function requestResetToken(email: string) {
  await app.inject({
    method: "POST",
    url: "/orgs/password/forgot",
    payload: { email },
  });

  const html = sendMock.mock.calls.at(-1)![0].html as string;
  const [, token] = html.match(/token=([a-f0-9]+)/) ?? [];
  return token;
}

describe("Reset Password Controller (e2e)", () => {
  afterEach(() => {
    sendMock.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to reset the password with a valid token", async () => {
    await app.ready();

    const org = await createOrg();
    const token = await requestResetToken(org.email);

    const response = await app.inject({
      method: "POST",
      url: "/orgs/password/reset",
      payload: { token, password: "new-password123" },
    });

    expect(response.statusCode).toEqual(200);

    const loginResponse = await app.inject({
      method: "POST",
      url: "/orgs/sessions",
      payload: { email: org.email, password: "new-password123" },
    });

    expect(loginResponse.statusCode).toEqual(200);
  });

  it("should not be able to log in with the old password after a reset", async () => {
    await app.ready();

    const org = await createOrg();
    const token = await requestResetToken(org.email);

    await app.inject({
      method: "POST",
      url: "/orgs/password/reset",
      payload: { token, password: "new-password123" },
    });

    const loginResponse = await app.inject({
      method: "POST",
      url: "/orgs/sessions",
      payload: { email: org.email, password: "password123" },
    });

    expect(loginResponse.statusCode).toEqual(400);
  });

  it("should not be able to reuse a reset token", async () => {
    await app.ready();

    const org = await createOrg();
    const token = await requestResetToken(org.email);

    await app.inject({
      method: "POST",
      url: "/orgs/password/reset",
      payload: { token, password: "new-password123" },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orgs/password/reset",
      payload: { token, password: "another-password" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to reset the password with an invalid token", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/orgs/password/reset",
      payload: { token: "invalid-token", password: "new-password123" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to reset the password with too short a password", async () => {
    await app.ready();

    const org = await createOrg();
    const token = await requestResetToken(org.email);

    const response = await app.inject({
      method: "POST",
      url: "/orgs/password/reset",
      payload: { token, password: "123" },
    });

    expect(response.statusCode).toEqual(400);
  });
});
