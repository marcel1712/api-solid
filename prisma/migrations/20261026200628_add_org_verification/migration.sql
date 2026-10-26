-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('Pending', 'UnderReview', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "OrgDocumentKind" AS ENUM ('Statute', 'BoardMinutes');

-- DropIndex
DROP INDEX "Org_city_idx";

-- AlterTable
ALTER TABLE "Org" ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "cnpjCheck" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "status" "OrgStatus" NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "OrgDocument" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" "OrgDocumentKind" NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgDocument_orgId_kind_key" ON "OrgDocument"("orgId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Org_cnpj_key" ON "Org"("cnpj");

-- CreateIndex
CREATE INDEX "Org_city_status_idx" ON "Org"("city", "status");

-- AddForeignKey
ALTER TABLE "OrgDocument" ADD CONSTRAINT "OrgDocument_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

