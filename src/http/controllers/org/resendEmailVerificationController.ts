import { makeResendEmailVerificationUseCase } from "@/use-cases/factories/make-resend-email-verification-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function resendEmailVerificationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const resendEmailVerificationBodyScheme = z.object({
    email: z.string().email(),
  });

  const { email } = resendEmailVerificationBodyScheme.parse(request.body);

  const resendEmailVerificationUseCase = makeResendEmailVerificationUseCase();
  await resendEmailVerificationUseCase.execute({ email });

  return reply.status(200).send({
    message:
      "If that email is registered and not yet verified, a new verification link has been sent.",
  });
}
