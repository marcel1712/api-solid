import { BlockedContactKind, PrismaClient } from "@prisma/client";
import {
  BlockedContactRepository,
  CreateBlockedContactData,
} from "@/repositories/blocked-contact-repository";

export class PrismaBlockedContactRepository
  implements BlockedContactRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateBlockedContactData): Promise<void> {
    await this.prisma.blockedContact.upsert({
      where: { kind_value: { kind: data.kind, value: data.value } },
      create: data,
      update: { reason: data.reason },
    });
  }

  async existsEmailOrWhatsapp(
    email: string,
    whatsapp: string,
  ): Promise<boolean> {
    const found = await this.prisma.blockedContact.findFirst({
      where: {
        OR: [
          { kind: BlockedContactKind.Email, value: email },
          { kind: BlockedContactKind.Whatsapp, value: whatsapp },
        ],
      },
    });
    return found !== null;
  }
}
