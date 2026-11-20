import { toOwnOrg } from "@/http/utils/org-views";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeUpdateOrgUseCase } from "@/use-cases/factories/make-update-org-use-case";
import { normalizeWhatsapp } from "@/utils/normalize-whatsapp";
import {
  addressSchema,
  citySchema,
  orgNameSchema,
} from "@/http/utils/schemas";

export async function updateOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const updateOrgParamsScheme = z.object({
    id: z.uuid(),
  });

  const updateOrgBodyScheme = z.object({
    name: orgNameSchema.optional(),
    whatsapp: z
      .string()
      .transform(normalizeWhatsapp)
      .pipe(z.string().e164())
      .optional(),
    city: citySchema.optional(),
    address: addressSchema.optional(),
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

  return reply.status(200).send(toOwnOrg(org));
}
