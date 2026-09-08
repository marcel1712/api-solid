import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeRegisterOrgUseCase } from "@/use-cases/factories/make-register-org-use-case";
import { generateOrgTokens } from "@/http/utils/generate-org-tokens";
import { refreshTokenCookieOptions } from "@/http/utils/refresh-token-cookie-options";

export async function registerOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createOrgBodyScheme = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    whatsapp: z.string().e164(),
    city: z.string(),
    address: z.string(),
  });

  const { name, email, password, whatsapp, city, address } =
    createOrgBodyScheme.parse(request.body);

  const registerOrgUseCase = makeRegisterOrgUseCase();

  const { org } = await registerOrgUseCase.execute({
    name,
    email,
    password,
    whatsapp,
    city,
    address,
  });

  const { token, refreshToken } = await generateOrgTokens(org.id);

  const { password_hash: _password_hash, ...publicOrg } = org;

  return reply
    .status(201)
    .setCookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .send({
      ...publicOrg,
      token,
    });
}
