import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";
import { AuthenticateOrgUseCase } from "../authenticateOrgUseCase";
import { prisma } from "@/lib/prisma";


export function makeAuthenticateOrgUseCase() {
    const orgRepository = new PrismaOrgRepository(prisma);
    const AuthenticatedOrg = new AuthenticateOrgUseCase(orgRepository);

    return AuthenticatedOrg;
}