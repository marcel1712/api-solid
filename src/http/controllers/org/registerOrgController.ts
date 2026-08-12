import { RegisterOrgUseCase } from "@/use-cases/registerOrg";
import { FastifyReply, FastifyRequest } from "fastify";
import { email, string, z } from "zod";
import { makeRegisterOrgUseCase } from "@/use-cases/factories/make-register-org-use-case";

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

  const { password_hash, ...publicOrg } = org;

  return reply.status(201).send(publicOrg);
}
