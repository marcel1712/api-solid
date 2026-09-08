import { OrgRepository } from "@/repositories/org-repository";
import { SendEmailVerificationUseCase } from "@/use-cases/sendEmailVerificationUseCase";

interface ResendEmailVerificationRequest {
  email: string;
}

export class ResendEmailVerificationUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private sendEmailVerificationUseCase: SendEmailVerificationUseCase,
  ) {}

  async execute(request: ResendEmailVerificationRequest): Promise<void> {
    const org = await this.orgRepository.findByEmail(request.email);

    if (!org || org.emailVerifiedAt) {
      return;
    }

    await this.sendEmailVerificationUseCase.execute({
      orgId: org.id,
      email: org.email,
    });
  }
}
