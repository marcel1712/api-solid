import { makeRefreshSessionUseCase } from "@/use-cases/factories/make-refresh-session-use-case";
import { InvalidSessionError } from "@/use-cases/errors/invalid-session-error";
import { FastifyReply, FastifyRequest } from "fastify";
import { generateAccessToken } from "@/http/utils/generate-access-token";
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "@/http/utils/refresh-token-cookie-options";

export async function refreshSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const currentToken = request.cookies[REFRESH_TOKEN_COOKIE];

  if (!currentToken) {
    throw new InvalidSessionError();
  }

  const refreshSessionUseCase = makeRefreshSessionUseCase();

  try {
    const { orgId, refreshToken } = await refreshSessionUseCase.execute({
      refreshToken: currentToken,
    });

    if (refreshToken) {
      reply.setCookie(
        REFRESH_TOKEN_COOKIE,
        refreshToken,
        refreshTokenCookieOptions,
      );
    }

    return reply.status(200).send({ token: generateAccessToken(orgId) });
  } catch (error) {
    // A dead cookie would be sent again on every page load for nothing.
    if (error instanceof InvalidSessionError) {
      reply.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions);
    }
    throw error;
  }
}
