import { OrgRepository } from "@/repositories/org-repository";
import { Org } from "@prisma/client";

interface GetOrgDetailsRequest {
    orgId: string;
}

export class GetOrgDetailsUseCase {
    
    constructor(private orgRepository: OrgRepository){}
    
    async execute(request: GetOrgDetailsRequest): Promise<Org> {
        const org = await this.orgRepository.findById(request.orgId);
        if(!org){
            throw new Error("This organization does not exist");
        }
        return org;
    }
}