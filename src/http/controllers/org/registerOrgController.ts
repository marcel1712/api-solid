import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeRegisterOrgUseCase } from "@/use-cases/factories/make-register-org-use-case";
import { makeSendEmailVerificationUseCase } from "@/use-cases/factories/make-send-email-verification-use-case";
import { normalizeWhatsapp } from "@/utils/normalize-whatsapp";
import { isValidCnpj, normalizeCnpj } from "@/utils/cnpj";
import { toOwnOrg } from "@/http/utils/org-views";

export async function registerOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createOrgBodyScheme = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    whatsapp: z
      .string()
      .transform(normalizeWhatsapp)
      .pipe(z.string().e164()),
    city: z.string(),
    address: z.string(),
    cnpj: z
      .string()
      .transform(normalizeCnpj)
      .refine(isValidCnpj, "Invalid CNPJ"),
  });

  const { name, email, password, whatsapp, city, address, cnpj } =
    createOrgBodyScheme.parse(request.body);

  const registerOrgUseCase = makeRegisterOrgUseCase();

  const { org } = await registerOrgUseCase.execute({
    name,
    email,
    password,
    whatsapp,
    city,
    address,
    cnpj,
  });

  try {
    const sendEmailVerificationUseCase = makeSendEmailVerificationUseCase();
    await sendEmailVerificationUseCase.execute({
      orgId: org.id,
      email: org.email,
    });
  } catch (error) {
    // The org is already created at this point — a flaky email provider
    // shouldn't fail the whole registration. Verification can be re-sent.
    request.log.error(error, "Failed to send the verification email");
  }

  // No session here: the org can't sign in until it verifies its email, and
  // handing out a token at signup would let it skip that check entirely.
  return reply.status(201).send(toOwnOrg(org));
}
