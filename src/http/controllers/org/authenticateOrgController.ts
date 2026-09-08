import { makeAuthenticateOrgUseCase } from "@/use-cases/factories/make-authenticate-org-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { generateOrgTokens } from "@/http/utils/generate-org-tokens";
import { refreshTokenCookieOptions } from "@/http/utils/refresh-token-cookie-options";

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

  const { org } = await authenticateOrgUseCase.execute({ email, password });

  const { token, refreshToken } = await generateOrgTokens(org.id);

  return reply
    .status(200)
    .setCookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .send({ token });
}
