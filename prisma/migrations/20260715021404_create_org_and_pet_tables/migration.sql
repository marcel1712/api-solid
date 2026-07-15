-- CreateEnum
CREATE TYPE "AnimalSize" AS ENUM ('Small', 'Medium', 'Large');

-- CreateEnum
CREATE TYPE "AnimalType" AS ENUM ('Dog', 'Cat', 'Bird', 'Fish', 'Turtle', 'Rabbit', 'Hamster', 'Furret', 'Chinchilla');

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "size" "AnimalSize" NOT NULL,
    "type" "AnimalType" NOT NULL,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adopted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Org_email_key" ON "Org"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Org_whatsapp_key" ON "Org"("whatsapp");

-- CreateIndex
CREATE INDEX "Org_city_idx" ON "Org"("city");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
