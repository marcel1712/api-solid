import { makeRequestPasswordResetUseCase } from "@/use-cases/factories/make-request-password-reset-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { emailSchema } from "@/http/utils/schemas";

export async function requestPasswordResetController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const requestPasswordResetBodyScheme = z.object({
    email: emailSchema,
  });

  const { email } = requestPasswordResetBodyScheme.parse(request.body);

  const requestPasswordResetUseCase = makeRequestPasswordResetUseCase();
  await requestPasswordResetUseCase.execute({ email });

  return reply.status(200).send({
    message: "If that email is registered, a reset link has been sent.",
  });
}
