import { OrgRepository } from "../repositories/org-repository";
import { Org } from "@prisma/client";
import { hash } from "bcrypt";

interface RegisterOrgRequest {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  city: string;
  address: string;
}

interface CreatedOrgResponse {
  org: Org;
}

export class RegisterOrgUseCase {
  constructor(private OrgRepository: OrgRepository) {}

  async execute(request: RegisterOrgRequest): Promise<CreatedOrgResponse> {
    const emailExist = await this.OrgRepository.findByEmail(request.email);
    if (emailExist) {
      throw new Error("This email is already registered");
    }

    const password_hash: string = request.password; //string = await hash('s0/\/\P4$$w0rD', 10)

    const org: Org = await this.OrgRepository.create({
      name: request.name,
      email: request.email,
      password_hash: password_hash,
      whatsapp: request.whatsapp,
      city: request.city,
      address: request.address,
    });

    return {
      org,
    };
  }
}
