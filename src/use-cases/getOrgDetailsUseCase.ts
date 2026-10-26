import { OrgRepository } from "@/repositories/org-repository";
import { Org, OrgStatus } from "@prisma/client";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetOrgDetailsRequest {
    orgId: string;
}

export class GetOrgDetailsUseCase {

    constructor(private orgRepository: OrgRepository){}

    async execute(request: GetOrgDetailsRequest): Promise<Org> {
        const org = await this.orgRepository.findById(request.orgId);
        // Public profile: only orgs that passed review have one.
        if(!org || org.status !== OrgStatus.Approved){
            throw new ResourceNotFoundError();
        }
        return org;
    }
}