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

function extractTokenFromLastEmail() {
  const html = sendMock.mock.calls.at(-1)![0].html as string;
  const [, token] = html.match(/token=([a-f0-9]+)/) ?? [];
  return token;
}

describe("Verify Email Controller (e2e)", () => {
  afterEach(() => {
    sendMock.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should send a verification email on registration", async () => {
    await app.ready();

    const org = await createOrg();

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ to: org.email }),
    );
  });

  it("should be able to verify the email with a valid token", async () => {
    await app.ready();

    await createOrg();
    const token = extractTokenFromLastEmail();

    const response = await app.inject({
      method: "GET",
      url: "/orgs/verify-email",
      query: { token },
    });

    expect(response.statusCode).toEqual(200);
  });

  it("should allow login after the email is verified", async () => {
    await app.ready();

    const org = await createOrg();
    const token = extractTokenFromLastEmail();

    await app.inject({
      method: "GET",
      url: "/orgs/verify-email",
      query: { token },
    });

    const loginResponse = await app.inject({
      method: "POST",
      url: "/orgs/sessions",
      payload: { email: org.email, password: "password123" },
    });

    expect(loginResponse.statusCode).toEqual(200);
  });

  it("should not be able to reuse a verification token", async () => {
    await app.ready();

    await createOrg();
    const token = extractTokenFromLastEmail();

    await app.inject({
      method: "GET",
      url: "/orgs/verify-email",
      query: { token },
    });

    const response = await app.inject({
      method: "GET",
      url: "/orgs/verify-email",
      query: { token },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to verify with an invalid token", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/orgs/verify-email",
      query: { token: "invalid-token" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("should not be able to verify without a token", async () => {
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/orgs/verify-email",
    });

    expect(response.statusCode).toEqual(400);
  });
});
