import { BlockedContactKind } from "@prisma/client";

export interface CreateBlockedContactData {
  kind: BlockedContactKind;
  value: string;
  reason?: string | null;
}

export interface BlockedContactRepository {
  create(data: CreateBlockedContactData): Promise<void>;
  /** True if either the email or the WhatsApp number is on the block list. */
  existsEmailOrWhatsapp(email: string, whatsapp: string): Promise<boolean>;
}
