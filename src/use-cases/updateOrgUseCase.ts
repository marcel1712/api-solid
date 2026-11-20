import { Org, OrgStatus } from "@prisma/client";
import type { OrgFieldChange } from "@/lib/email-templates";
import { reportError } from "@/lib/monitoring";
import { OrgRepository } from "@/repositories/org-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";

interface UpdateOrgRequest {
  orgId: string;
  requesterOrgId: string;
  name?: string;
  whatsapp?: string;
  city?: string;
  address?: string;
}

export interface OrgChangeNotifier {
  notifyApprovedOrgChanged(params: {
    orgName: string;
    changes: OrgFieldChange[];
  }): Promise<void>;
}

export class UpdateOrgUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private notifier?: OrgChangeNotifier,
  ) {}

  async execute(request: UpdateOrgRequest): Promise<Org> {
    const org = await this.orgRepository.findById(request.orgId);

    if (!org) {
      throw new ResourceNotFoundError();
    }

    if (org.id !== request.requesterOrgId) {
      throw new NotAllowedError();
    }

    // Copied now: a repository may hand back the same object it updates.
    const before = { name: org.name, whatsapp: org.whatsapp, status: org.status };

    const updatedOrg = await this.orgRepository.update(request.orgId, {
      name: request.name,
      whatsapp: request.whatsapp,
      city: request.city,
      address: request.address,
    });

    // Approval vouched for these values. An approved org swapping its
    // WhatsApp is how an adoption scam would start, so the team is told.
    if (before.status === OrgStatus.Approved && updatedOrg) {
      const changes: OrgFieldChange[] = [];
      if (updatedOrg.whatsapp !== before.whatsapp) {
        changes.push({
          label: "WhatsApp",
          before: before.whatsapp,
          after: updatedOrg.whatsapp,
        });
      }
      if (updatedOrg.name !== before.name) {
        changes.push({ label: "Nome", before: before.name, after: updatedOrg.name });
      }
      if (changes.length > 0 && this.notifier) {
        try {
          await this.notifier.notifyApprovedOrgChanged({
            orgName: updatedOrg.name,
            changes,
          });
        } catch (error) {
          // The change is saved either way; a lost notice mustn't fail it.
          reportError(error, { email: "approved org changed" });
        }
      }
    }

    return updatedOrg as Org;
  }
}
