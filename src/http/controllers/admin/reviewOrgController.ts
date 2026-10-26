import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeReviewOrgUseCase } from "@/use-cases/factories/make-review-org-use-case";
import { ResendMailer } from "@/lib/resend-mailer";
import { toOwnOrg } from "@/http/utils/org-views";
import env from "@/env/env";

export async function reviewOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.uuid() });
  const bodySchema = z.discriminatedUnion("decision", [
    z.object({ decision: z.literal("approve") }),
    z.object({
      decision: z.literal("reject"),
      // It's sent to the org as is: it has to say what to fix.
      reason: z.string().trim().min(10).max(1000),
    }),
  ]);

  const { id } = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);

  const useCase = makeReviewOrgUseCase();
  const org = await useCase.execute({ orgId: id, ...body });

  const dashboardUrl = `${env.FRONTEND_URL}/ong/painel`;
  try {
    const mailer = new ResendMailer();
    if (body.decision === "approve") {
      await mailer.sendOrgApprovedEmail({
        to: org.email,
        orgName: org.name,
        dashboardUrl,
      });
    } else {
      await mailer.sendOrgRejectedEmail({
        to: org.email,
        orgName: org.name,
        reason: body.reason,
        dashboardUrl,
      });
    }
  } catch (error) {
    // The decision is saved; the org also sees it on its dashboard.
    request.log.error(error, "Failed to send the review decision email");
  }

  return reply.status(200).send(toOwnOrg(org));
}
