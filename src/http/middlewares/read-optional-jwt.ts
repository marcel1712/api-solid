import { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import env from "@/env/env";

/**
 * For public routes that show more to the owner: identifies the org when a
 * valid token comes along, and lets the request through as anonymous when
 * it doesn't — a stale token on a public page is not an error.
 */
export async function readOptionalJwt(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return;
  }

  try {
    const payload = jwt.verify(
      authHeader.slice("Bearer ".length),
      env.JWT_SECRET,
      { algorithms: ["HS256"] },
    ) as { sub: string };
    request.orgId = payload.sub;
  } catch {
    // Anonymous, then.
  }
}
