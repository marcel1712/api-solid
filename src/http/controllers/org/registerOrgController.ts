import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeRegisterOrgUseCase } from "@/use-cases/factories/make-register-org-use-case";
import { makeSendEmailVerificationUseCase } from "@/use-cases/factories/make-send-email-verification-use-case";
import { normalizeWhatsapp } from "@/utils/normalize-whatsapp";
import { isValidCnpj, normalizeCnpj } from "@/utils/cnpj";
import { toOwnOrg } from "@/http/utils/org-views";
import { reportError } from "@/lib/monitoring";
import { ACCEPTED_TERMS_VERSIONS } from "@/utils/terms";
import { passwordProblem } from "@/utils/password-policy";
import {
  addressSchema,
  citySchema,
  emailSchema,
  orgNameSchema,
} from "@/http/utils/schemas";

export async function registerOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createOrgBodyScheme = z.object({
    name: orgNameSchema,
    email: emailSchema,
    password: z.string(),
    whatsapp: z
      .string()
      .transform(normalizeWhatsapp)
      .pipe(z.string().e164()),
    city: citySchema,
    address: addressSchema,
    cnpj: z
      .string()
      .transform(normalizeCnpj)
      .refine(isValidCnpj, "Invalid CNPJ"),
    // Consent has to be given to a text that's live (see ACCEPTED_TERMS_VERSIONS):
    // a page opened long before an update sends a retired version and is
    // turned away.
    termsVersion: z.enum(ACCEPTED_TERMS_VERSIONS),
  }).superRefine(({ password, email }, ctx) => {
    // On the object, not the field: one of the rules needs the email.
    const problem = passwordProblem(password, email);
    if (problem) {
      ctx.addIssue({ code: "custom", path: ["password"], message: problem });
    }
  });

  const { name, email, password, whatsapp, city, address, cnpj, termsVersion } =
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
    termsVersion,
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
    reportError(error, { email: "verification" });
  }

  // No session here: the org can't sign in until it verifies its email, and
  // handing out a token at signup would let it skip that check entirely.
  return reply.status(201).send(toOwnOrg(org));
}
