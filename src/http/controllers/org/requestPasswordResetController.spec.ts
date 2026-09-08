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

describe("Request Password Reset Controller (e2e)", () => {
  afterEach(() => {
    sendMock.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should send a reset email for a registered org", async () => {
    await app.ready();

    const org = await createOrg();
    sendMock.mockClear();

    const response = await app.inject({
      method: "POST",
      url: "/orgs/password/forgot",
      payload: { email: org.email },
    });

    expect(response.statusCode).toEqual(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ to: org.email }),
    );
  });

  it("should return the same generic response for an unregistered email", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/orgs/password/forgot",
      payload: { email: "unknown@email.com" },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("should not be able to request a reset with an invalid email", async () => {
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/orgs/password/forgot",
      payload: { email: "not-an-email" },
    });

    expect(response.statusCode).toEqual(400);
  });
});
