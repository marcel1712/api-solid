import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeUpdateOrgUseCase } from "@/use-cases/factories/make-update-org-use-case";
import { normalizeWhatsapp } from "@/utils/normalize-whatsapp";

export async function updateOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const updateOrgParamsScheme = z.object({
    id: z.uuid(),
  });

  const updateOrgBodyScheme = z.object({
    name: z.string().trim().min(1).optional(),
    whatsapp: z
      .string()
      .transform(normalizeWhatsapp)
      .pipe(z.string().e164())
      .optional(),
    city: z.string().trim().min(1).optional(),
    address: z.string().trim().min(1).optional(),
  });

  const { id } = updateOrgParamsScheme.parse(request.params);
  const { name, whatsapp, city, address } = updateOrgBodyScheme.parse(
    request.body,
  );

  const requesterOrgId = request.orgId as string;

  const updateOrgUseCase = makeUpdateOrgUseCase();
  const org = await updateOrgUseCase.execute({
    orgId: id,
    requesterOrgId,
    name,
    whatsapp,
    city,
    address,
  });

  const { password_hash: _password_hash, ...orgResponse } = org;

  return reply.status(200).send(orgResponse);
}
