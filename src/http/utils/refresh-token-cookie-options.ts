import { CookieSerializeOptions } from "@fastify/cookie";
import env from "@/env/env";
import { SESSION_EXPIRES_IN_MS } from "@/use-cases/createSessionUseCase";

export const REFRESH_TOKEN_COOKIE = "refreshToken";

// Scoped to the session routes: the cookie only travels on login, refresh and
// logout, never on the rest of the API.
export const refreshTokenCookieOptions: CookieSerializeOptions = {
  path: "/orgs/sessions",
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: SESSION_EXPIRES_IN_MS / 1000,
};
