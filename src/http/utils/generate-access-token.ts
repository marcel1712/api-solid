import jwt from "jsonwebtoken";
import env from "@/env/env";

// Short-lived on purpose: the access token lives in the client's memory and
// can't be revoked, so it's the refresh session — stored and revocable in the
// database — that carries the long life.
export const ACCESS_TOKEN_EXPIRES_IN = "15m";

export function generateAccessToken(orgId: string): string {
  return jwt.sign({ sub: orgId }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}
