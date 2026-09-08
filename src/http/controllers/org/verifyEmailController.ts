import { makeVerifyEmailUseCase } from "@/use-cases/factories/make-verify-email-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function verifyEmailController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const verifyEmailQueryScheme = z.object({
    token: z.string().min(1),
  });

  const { token } = verifyEmailQueryScheme.parse(request.query);

  const verifyEmailUseCase = makeVerifyEmailUseCase();
  await verifyEmailUseCase.execute({ token });

  return reply.status(200).send({ message: "Email verified successfully." });
}
