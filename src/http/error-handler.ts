import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { ResourceAlreadyExistsError } from "@/use-cases/errors/resource-already-exists-error";
import { LimitExceededError } from "@/use-cases/errors/limit-exceeded-error";
import env from "@/env/env";

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

  if (env.NODE_ENV !== "production") {
    console.error(error);
  }

  // TODO: send unexpected errors to an external log/monitoring tool (e.g. Sentry, Datadog) in production
  return reply.status(500).send({ message: "Internal server error" });
}
