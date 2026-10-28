-- CreateEnum
CREATE TYPE "BlockedContactKind" AS ENUM ('Email', 'Whatsapp');

-- CreateTable
CREATE TABLE "BlockedContact" (
    "id" TEXT NOT NULL,
    "kind" "BlockedContactKind" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedContact_kind_value_key" ON "BlockedContact"("kind", "value");
