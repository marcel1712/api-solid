import { makeAuthenticateOrgUseCase } from "@/use-cases/factories/make-authenticate-org-use-case";
import { makeCreateSessionUseCase } from "@/use-cases/factories/make-create-session-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { emailSchema } from "@/http/utils/schemas";
import { MAX_PASSWORD_LENGTH } from "@/utils/password-policy";
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
    email: emailSchema,
    // No strength rules here: accounts from before the policy must still get
    // in. The upper bound only keeps bcrypt from hashing megabytes.
    password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
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
