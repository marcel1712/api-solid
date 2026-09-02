import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeRegisterOrgUseCase } from "@/use-cases/factories/make-register-org-use-case";
import { generateOrgTokens } from "@/http/utils/generate-org-tokens";
import env from "@/env/env";

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

  try {
    const { org } = await registerOrgUseCase.execute({
      name,
      email,
      password,
      whatsapp,
      city,
      address,
    });
    
    const { token, refreshToken } = await generateOrgTokens(org.id);
    
    const { password_hash, ...publicOrg } = org;



  return reply
    .status(201)
    .setCookie("refreshToken", refreshToken, {
      path: "/",
      secure: env.NODE_ENV === "production",
      sameSite: true,
      httpOnly: true,
    })
    .send({
      ...publicOrg,
      token,
    });
  } catch {
    return reply.status(409).send({ error: "Unable to register with the provided information" });
  }
}
