import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/prisma";

/**
 * Signup no longer hands out a token, and login is closed until the email is
 * verified. Specs that only need an authenticated org skip the email round
 * trip: mark it verified straight in the database, then sign in for real.
 *
 * The org is also approved by default, since most specs exercise what an
 * approved org can do; pass `approved: false` to keep it under review.
 */
export async function signInRegisteredOrg<T extends { id: string; email: string }>(
  app: FastifyInstance,
  org: T,
  { password = "password123", approved = true } = {},
): Promise<T & { token: string }> {
  await prisma.org.update({
    where: { id: org.id },
    data: {
      emailVerifiedAt: new Date(),
      ...(approved && { status: "Approved" }),
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/orgs/sessions",
    payload: { email: org.email, password },
  });

  return { ...org, token: response.json().token };
}
