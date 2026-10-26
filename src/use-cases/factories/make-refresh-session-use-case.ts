import { prisma } from "@/lib/prisma";
import { PrismaSessionRepository } from "@/repositories/prisma/prisma-session-repository";
import { RefreshSessionUseCase } from "../refreshSessionUseCase";

export function makeRefreshSessionUseCase() {
  const sessionRepository = new PrismaSessionRepository(prisma);
  return new RefreshSessionUseCase(sessionRepository);
}
