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

describe("Resend Email Verification Controller (e2e)", () => {
  afterEach(() => {
    sendMock.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to request a new verification email", async () => {
    await app.ready();

    const org = await createOrg();
    sendMock.mockClear();

    const response = await app.inject({
      method: "POST",
      url: "/orgs/verify-email/resend",
      payload: { email: org.email },
    });

    expect(response.statusCode).toEqual(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ to: org.email }),
    );
  });

  it("should let an expired/lost link be replaced and still verify the account", async () => {
    await app.ready();

    const org = await createOrg();

    const resendResponse = await app.inject({
      method: "POST",
      url: "/orgs/verify-email/resend",
      payload: { email: org.email },
    });
    expect(resendResponse.statusCode).toEqual(200);

    const token = extractTokenFromLastEmail();

    const verifyResponse = await app.inject({
      method: "GET",
      url: "/orgs/verify-email",
      query: { token },
    });
    expect(verifyResponse.statusCode).toEqual(200);

    const loginResponse = await app.inject({
      method: "POST",
      url: "/orgs/sessions",
      payload: { email: org.email, password: "password123" },
    });
    expect(loginResponse.statusCode).toEqual(200);
  });

  it("should not send an email when the org is already verified", async () => {
    await app.ready();

    const org = await createOrg();
    const token = extractTokenFromLastEmail();
    await app.inject({
      method: "GET",
      url: "/orgs/verify-email",
      query: { token },
    });
    sendMock.mockClear();

    const response = await app.inject({
      method: "POST",
      url: "/orgs/verify-email/resend",
      payload: { email: org.email },
    });

    expect(response.statusCode).toEqual(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("should return the same generic response for an unregistered email", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/orgs/verify-email/resend",
      payload: { email: "unknown@email.com" },
    });

    expect(response.statusCode).toEqual(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("should not be able to request a resend with an invalid email", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/orgs/verify-email/resend",
      payload: { email: "not-an-email" },
    });

    expect(response.statusCode).toEqual(400);
  });
});
