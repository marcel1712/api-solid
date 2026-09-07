import { OrgRepository } from "@/repositories/org-repository";
import { Org } from "@prisma/client";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetOrgDetailsRequest {
    orgId: string;
}

export class GetOrgDetailsUseCase {

    constructor(private orgRepository: OrgRepository){}

    async execute(request: GetOrgDetailsRequest): Promise<Org> {
        const org = await this.orgRepository.findById(request.orgId);
        if(!org){
            throw new ResourceNotFoundError();
        }
        return org;
    }
}