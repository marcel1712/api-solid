import { makeResetPasswordUseCase } from "@/use-cases/factories/make-reset-password-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function resetPasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const resetPasswordBodyScheme = z.object({
    token: z.string().min(1),
    password: z.string().min(6),
  });

  const { token, password } = resetPasswordBodyScheme.parse(request.body);

  const resetPasswordUseCase = makeResetPasswordUseCase();
  await resetPasswordUseCase.execute({ token, password });

  return reply.status(200).send({ message: "Password updated successfully." });
}
