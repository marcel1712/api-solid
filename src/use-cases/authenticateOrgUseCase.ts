import { OrgRepository } from "@/repositories/org-repository";
import { Org } from "@prisma/client";
import { compare } from "bcrypt";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { EmailNotVerifiedError } from "@/use-cases/errors/email-not-verified-error";

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
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await compare(request.password, org.password_hash);

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (!org.emailVerifiedAt) {
      throw new EmailNotVerifiedError();
    }

    const { created_at: _created_at, password_hash: _password_hash, ...orgPreview } = org;

    const authenticatedOrg: AuthenticatedOrg = {
      org: orgPreview,
    };
    return authenticatedOrg;
  }
}
