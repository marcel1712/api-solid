import { makeAuthenticateOrgUseCase } from "@/use-cases/factories/make-authenticate-org-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import env from "@/env/env";
import { generateOrgTokens } from "@/http/utils/generate-org-tokens";

export async function authenticateOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authenticateOrgBodyScheme = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
  });

  const { email, password } = authenticateOrgBodyScheme.parse(request.body);

  const authenticateOrgUseCase = makeAuthenticateOrgUseCase();

  try {
    const { org } = await authenticateOrgUseCase.execute({ email, password });

    const { token, refreshToken } = await generateOrgTokens(org.id);

    return reply
      .status(200)
      .setCookie("refreshToken", refreshToken, {
        path: "/",
        secure: env.NODE_ENV === "production",
        sameSite: true,
        httpOnly: true,
      })
      .send({ token });
      
  } catch (err) {
    return reply.status(400).send({
      message: "Invalid email or password",
    });
  }
}
