import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import app from "@/app";
import { randomCnpj } from "@/test/random-cnpj";
import { signInRegisteredOrg } from "@/test/sign-in-registered-org";

async function signIn() {
  const response = await app.inject({
    method: "POST",
    url: "/orgs",
    payload: {
      name: "Pet Friends",
      email: `${randomUUID()}@email.com`,
      password: "password123",
      whatsapp: `+551199${Math.floor(1000000 + Math.random() * 8999999)}`,
      city: "São Carlos",
      address: "Rua das Flores, 900",
      cnpj: randomCnpj(),
    },
  });
  const org = response.json();
  // Verifies the email; the login below is the one whose cookie the specs use.
  await signInRegisteredOrg(app, org);

  const login = await app.inject({
    method: "POST",
    url: "/orgs/sessions",
    payload: { email: org.email, password: "password123" },
  });

  const cookie = login.cookies.find((item) => item.name === "refreshToken");
  return { cookie: cookie! };
}

function refresh(refreshToken?: string) {
  return app.inject({
    method: "POST",
    url: "/orgs/sessions/refresh",
    cookies: refreshToken ? { refreshToken } : {},
  });
}

describe("Session Controllers (e2e)", () => {
  afterAll(async () => {
    await app.close();
  });

  it("should scope the refresh cookie to the session routes", async () => {
    await app.ready();

    const { cookie } = await signIn();

    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toEqual("Lax");
    expect(cookie.path).toEqual("/orgs/sessions");
    expect(cookie.maxAge).toEqual(7 * 24 * 60 * 60);
  });

  it("should issue a new access token and rotate the cookie", async () => {
    await app.ready();

    const { cookie } = await signIn();

    const response = await refresh(cookie.value);

    expect(response.statusCode).toEqual(200);
    const newCookie = response.cookies.find(
      (item) => item.name === "refreshToken",
    );
    expect(newCookie?.value).toEqual(expect.any(String));
    expect(newCookie?.value).not.toEqual(cookie.value);

    const me = await app.inject({
      method: "GET",
      url: "/orgs/me/pets?page=1",
      headers: { authorization: `Bearer ${response.json().token}` },
    });
    expect(me.statusCode).toEqual(200);
  });

  it("should not refresh without a cookie", async () => {
    await app.ready();

    const response = await refresh();

    expect(response.statusCode).toEqual(401);
  });

  it("should not refresh with an invalid cookie", async () => {
    await app.ready();

    const response = await refresh("not-a-real-token");

    expect(response.statusCode).toEqual(401);
  });

  it("should not accept the refresh token as an access token", async () => {
    await app.ready();

    const { cookie } = await signIn();

    const response = await app.inject({
      method: "GET",
      url: "/orgs/me/pets?page=1",
      headers: { authorization: `Bearer ${cookie.value}` },
    });

    expect(response.statusCode).toEqual(401);
  });

  it("should sign out and refuse the revoked session", async () => {
    await app.ready();

    const { cookie } = await signIn();

    const signOut = await app.inject({
      method: "DELETE",
      url: "/orgs/sessions",
      cookies: { refreshToken: cookie.value },
    });

    expect(signOut.statusCode).toEqual(204);
    const cleared = signOut.cookies.find((item) => item.name === "refreshToken");
    expect(cleared?.value).toEqual("");

    const response = await refresh(cookie.value);
    expect(response.statusCode).toEqual(401);
  });
});
