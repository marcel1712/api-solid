import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BlockedContactKind } from "@prisma/client";
import { OrgRepository } from "@/repositories/org-repository";
import { OrgDocumentRepository } from "@/repositories/org-document-repository";
import { PetRepository } from "@/repositories/pet-repository";
import { PetImageRepository } from "@/repositories/pet-image-repository";
import { SessionRepository } from "@/repositories/session-repository";
import { PasswordResetTokenRepository } from "@/repositories/password-reset-token-repository";
import { EmailVerificationTokenRepository } from "@/repositories/email-verification-token-repository";
import { BlockedContactRepository } from "@/repositories/blocked-contact-repository";
import { DocumentStorage } from "@/lib/document-storage";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { r2 } from "@/lib/r2";
import env from "@/env/env";

interface DeleteOrgRequest {
  orgId: string;
  /** Recorded on the block-list entries, for an audit trail. */
  reason: string;
}

export class DeleteOrgUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private orgDocumentRepository: OrgDocumentRepository,
    private petRepository: PetRepository,
    private petImageRepository: PetImageRepository,
    private sessionRepository: SessionRepository,
    private passwordResetTokenRepository: PasswordResetTokenRepository,
    private emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private blockedContactRepository: BlockedContactRepository,
    private documentStorage: DocumentStorage,
  ) {}

  async execute(request: DeleteOrgRequest): Promise<void> {
    const org = await this.orgRepository.findById(request.orgId);
    if (!org) {
      throw new ResourceNotFoundError();
    }

    const documents = await this.orgDocumentRepository.findManyByOrgId(
      org.id,
    );
    for (const document of documents) {
      await this.documentStorage.delete(document.key);
    }
    await this.orgDocumentRepository.deleteManyByOrgId(org.id);

    const pets = await this.petRepository.findAllByOrgId(org.id);
    const petIds = pets.map((pet) => pet.id);
    if (petIds.length > 0) {
      const images = await this.petImageRepository.findManyByPetIds(petIds);
      for (const image of images) {
        await r2.send(
          new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: image.key }),
        );
      }
      await this.petImageRepository.deleteManyByPetIds(petIds);
      await this.petRepository.deleteManyByOrgId(org.id);
    }

    await this.sessionRepository.deleteManyByOrgId(org.id);
    await this.passwordResetTokenRepository.deleteManyByOrgId(org.id);
    await this.emailVerificationTokenRepository.deleteManyByOrgId(org.id);

    // The point of deleting is to stop this org from existing *and* to stop
    // whoever ran it from signing up again under the same contact details —
    // deleting the row alone would free the email/WhatsApp for reuse.
    await this.blockedContactRepository.create({
      kind: BlockedContactKind.Email,
      value: org.email,
      reason: request.reason,
    });
    await this.blockedContactRepository.create({
      kind: BlockedContactKind.Whatsapp,
      value: org.whatsapp,
      reason: request.reason,
    });

    await this.orgRepository.delete(org.id);
  }
}
