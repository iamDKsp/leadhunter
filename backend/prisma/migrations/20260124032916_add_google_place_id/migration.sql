/*
  Warnings:

  - A unique constraint covering the columns `[googlePlaceId]` on the table `companies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "companies" ADD COLUMN "googlePlaceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "companies_googlePlaceId_key" ON "companies"("googlePlaceId");
