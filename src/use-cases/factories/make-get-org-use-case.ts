import { prisma } from "@/lib/prisma";
import { GetOrgDetailsUseCase } from "../getOrgDetailsUseCase";
import { PrismaOrgRepository } from "@/repositories/prisma/prisma-org-repository";


export function makeGetOrgDetailsUseCase() {
    const orgRepository = new PrismaOrgRepository(prisma);
    return new GetOrgDetailsUseCase(orgRepository);
}