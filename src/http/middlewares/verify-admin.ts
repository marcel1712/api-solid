import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import env from "@/env/env";

export function isAdminEmail(email: string): boolean {
  return env.ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Runs after `verifyJwt`. The admin list holds emails, so the check reads the
 * account's current email from the database rather than trusting anything in
 * the token, and requires it verified: an unconfirmed signup with an admin's
 * address must not open the panel.
 */
export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const org = request.orgId
    ? await new PrismaOrgRepository(prisma).findById(request.orgId)
    : null;

  if (!org || !org.emailVerifiedAt || !isAdminEmail(org.email)) {
    return reply.status(403).send({ message: "Not allowed." });
  }
}
