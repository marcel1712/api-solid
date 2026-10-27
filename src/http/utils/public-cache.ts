import { FastifyReply, FastifyRequest } from "fastify";

/**
 * Public listings change slowly (a pet gets adopted, a new one is posted), so
 * browsers may reuse an answer for a short while and refresh it in the
 * background. A request carrying a token may see the org's own drafts, which
 * must never be served to anyone else: those aren't cached at all.
 */
export function setPublicCache(request: FastifyRequest, reply: FastifyReply) {
  reply.header(
    "Cache-Control",
    request.headers.authorization
      ? "private, no-store"
      : "public, max-age=30, stale-while-revalidate=300",
  );
  reply.header("Vary", "Authorization");
}
