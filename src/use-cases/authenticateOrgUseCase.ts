import { OrgRepository } from "@/repositories/org-repository";
import { Org } from "@prisma/client";
import { compare } from "bcrypt";

interface AuthenticateOrgRequest {
  email: string;
  password: string;
}

type OrgPreview = Omit<Org, "password_hash" | "created_at">;

interface AuthenticatedOrg {
  org: OrgPreview;
}

export class AuthenticateOrgUseCase {
  constructor(private orgRepository: OrgRepository) {}


  async execute(request: AuthenticateOrgRequest): Promise<AuthenticatedOrg> {
    const org = await this.orgRepository.findByEmail(request.email);

    if (!org) {
      throw new Error(
        "Authentication error verify if the email or password is correct",
      );
    }
    
    const passwordMatches = await compare(request.password, org.password_hash);

    if (!passwordMatches) {
      throw new Error(
        "Authentication error verify if the email or password is correct",
      );
    }

    const { created_at, password_hash, ...orgPreview } = org;

    const authenticatedOrg: AuthenticatedOrg = {
      org: orgPreview,
    };
    return authenticatedOrg;
  }
}
