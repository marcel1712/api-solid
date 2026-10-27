import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/node";
import { scrubBreadcrumb, scrubEvent } from "./monitoring";

describe("Monitoring scrubbing", () => {
  it("should strip tokens, bodies, cookies, credentials and user data", () => {
    const event = scrubEvent({
      type: undefined,
      request: {
        url: "https://api.tailhop.com.br/orgs/verify-email?token=secret",
        query_string: "token=secret",
        cookies: { refreshToken: "secret" },
        data: { email: "ong@email.com", password: "secret" },
        headers: {
          Authorization: "Bearer secret",
          cookie: "refreshToken=secret",
          "user-agent": "Mozilla",
        },
      },
      user: { ip_address: "200.1.2.3", email: "ong@email.com" },
    } as ErrorEvent);

    expect(event.request?.url).toEqual(
      "https://api.tailhop.com.br/orgs/verify-email",
    );
    expect(event.request?.headers).toEqual({ "user-agent": "Mozilla" });
    expect(event.request).not.toHaveProperty("query_string");
    expect(event.request).not.toHaveProperty("cookies");
    expect(event.request).not.toHaveProperty("data");
    expect(event).not.toHaveProperty("user");
    expect(JSON.stringify(event)).not.toContain("secret");
  });

  it("should strip the query string from breadcrumb URLs", () => {
    const breadcrumb = scrubBreadcrumb({
      category: "http",
      data: { url: "https://x.test/reset-password?token=secret", method: "GET" },
    });

    expect(breadcrumb.data).toEqual({
      url: "https://x.test/reset-password",
      method: "GET",
    });
  });
});
