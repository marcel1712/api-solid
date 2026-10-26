import { makeAuthenticateOrgUseCase } from "@/use-cases/factories/make-authenticate-org-use-case";
import { makeCreateSessionUseCase } from "@/use-cases/factories/make-create-session-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { generateAccessToken } from "@/http/utils/generate-access-token";
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "@/http/utils/refresh-token-cookie-options";

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

  const createSessionUseCase = makeCreateSessionUseCase();
  const { refreshToken } = await createSessionUseCase.execute({
    orgId: org.id,
  });

  return reply
    .status(200)
    .setCookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions)
    .send({ token: generateAccessToken(org.id) });
}
