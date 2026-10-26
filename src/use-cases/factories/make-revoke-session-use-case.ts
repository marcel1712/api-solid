import { prisma } from "@/lib/prisma";
import { PrismaSessionRepository } from "@/repositories/prisma/prisma-session-repository";
import { RevokeSessionUseCase } from "../revokeSessionUseCase";

export function makeRevokeSessionUseCase() {
  const sessionRepository = new PrismaSessionRepository(prisma);
  return new RevokeSessionUseCase(sessionRepository);
}
