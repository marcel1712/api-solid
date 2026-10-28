import { BlockedContact } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  BlockedContactRepository,
  CreateBlockedContactData,
} from "@/repositories/blocked-contact-repository";

export class InMemoryBlockedContactRepository
  implements BlockedContactRepository
{
  public items: BlockedContact[] = [];

  async create(data: CreateBlockedContactData): Promise<void> {
    const existing = this.items.find(
      (item) => item.kind === data.kind && item.value === data.value,
    );
    if (existing) {
      existing.reason = data.reason ?? null;
      return;
    }

    this.items.push({
      id: randomUUID(),
      kind: data.kind,
      value: data.value,
      reason: data.reason ?? null,
      created_at: new Date(),
    });
  }

  async existsEmailOrWhatsapp(
    email: string,
    whatsapp: string,
  ): Promise<boolean> {
    return this.items.some(
      (item) =>
        (item.kind === "Email" && item.value === email) ||
        (item.kind === "Whatsapp" && item.value === whatsapp),
    );
  }
}
