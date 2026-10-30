import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { ResourceAlreadyExistsError } from "@/use-cases/errors/resource-already-exists-error";
import { LimitExceededError } from "@/use-cases/errors/limit-exceeded-error";
import { InvalidOrExpiredTokenError } from "@/use-cases/errors/invalid-or-expired-token-error";
import { EmailNotVerifiedError } from "@/use-cases/errors/email-not-verified-error";
import { InvalidSessionError } from "@/use-cases/errors/invalid-session-error";
import { CnpjNotFoundError } from "@/use-cases/errors/cnpj-not-found-error";
import { CnpjNotEligibleError } from "@/use-cases/errors/cnpj-not-eligible-error";
import { RegistrationBlockedError } from "@/use-cases/errors/registration-blocked-error";
import { reportError } from "@/lib/monitoring";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation error",
      issues: error.issues,
    });
  }

  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({ message: error.message });
  }

  if (error instanceof NotAllowedError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof InvalidCredentialsError) {
    return reply.status(400).send({ message: error.message });
  }

  if (error instanceof ResourceAlreadyExistsError) {
    return reply.status(409).send({ message: error.message });
  }

  if (error instanceof LimitExceededError) {
    return reply.status(409).send({ message: error.message });
  }

  if (error instanceof InvalidOrExpiredTokenError) {
    return reply.status(400).send({ message: error.message });
  }

  // Well-formed but unknown to the Receita: not a validation slip the form
  // can point at, so it gets its own code for the client to explain.
  if (error instanceof CnpjNotFoundError) {
    return reply
      .status(422)
      .send({ message: error.message, code: "CNPJ_NOT_FOUND" });
  }

  if (error instanceof CnpjNotEligibleError) {
    return reply
      .status(422)
      .send({ message: error.message, code: "CNPJ_NOT_ELIGIBLE" });
  }

  if (error instanceof RegistrationBlockedError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof InvalidSessionError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof EmailNotVerifiedError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error.statusCode === 429) {
    return reply.status(429).send({ message: error.message });
  }

  // Fastify itself raises 4xx errors (malformed JSON body, wrong
  // content-type, oversized payload) that match none of the cases above.
  // These are the client's fault, not ours: pass the status through instead
  // of masking them as a 500 and reporting them as a server bug.
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  // The client only ever sees the generic message below; the details go to
  // the server log. Silencing this in production left every 500 on Render
  // without a trace.
  request.log.error(error);
  reportError(error, { route: request.routeOptions.url, method: request.method });

  return reply.status(500).send({ message: "Internal server error" });
}
