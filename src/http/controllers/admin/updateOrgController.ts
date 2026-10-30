import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeAdminUpdateOrgUseCase } from "@/use-cases/factories/make-admin-update-org-use-case";
import { toOwnOrg } from "@/http/utils/org-views";
import { normalizeWhatsapp } from "@/utils/normalize-whatsapp";

export async function adminUpdateOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.uuid() });
  // CNPJ isn't editable here: changing it changes who the org legally is,
  // which belongs in the verification flow, not a quick fix.
  const bodySchema = z.object({
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    whatsapp: z
      .string()
      .transform(normalizeWhatsapp)
      .pipe(z.string().e164())
      .optional(),
    city: z.string().trim().min(1).optional(),
    address: z.string().trim().min(1).optional(),
  });

  const { id } = paramsSchema.parse(request.params);
  const data = bodySchema.parse(request.body);

  const useCase = makeAdminUpdateOrgUseCase();
  const org = await useCase.execute({ orgId: id, ...data });

  return reply.status(200).send(toOwnOrg(org));
}
