import { prisma } from "@/lib/prisma";
import { PrismaSessionRepository } from "@/repositories/prisma/prisma-session-repository";
import { CreateSessionUseCase } from "../createSessionUseCase";

export function makeCreateSessionUseCase() {
  const sessionRepository = new PrismaSessionRepository(prisma);
  return new CreateSessionUseCase(sessionRepository);
}
