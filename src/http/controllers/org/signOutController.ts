import { makeRevokeSessionUseCase } from "@/use-cases/factories/make-revoke-session-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "@/http/utils/refresh-token-cookie-options";

export async function signOutController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];

  if (refreshToken) {
    const revokeSessionUseCase = makeRevokeSessionUseCase();
    await revokeSessionUseCase.execute({ refreshToken });
  }

  return reply
    .clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions)
    .status(204)
    .send();
}
