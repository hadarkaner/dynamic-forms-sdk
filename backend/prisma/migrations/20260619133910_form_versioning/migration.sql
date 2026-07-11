/*
  Warnings:

  - You are about to drop the column `formId` on the `form_fields` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `forms` table. All the data in the column will be lost.
  - Added the required column `formVersionId` to the `form_fields` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "form_fields" DROP CONSTRAINT "form_fields_formId_fkey";

-- DropIndex
DROP INDEX "form_fields_formId_idx";

-- AlterTable
ALTER TABLE "form_fields" DROP COLUMN "formId",
ADD COLUMN     "formVersionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "forms" DROP COLUMN "description",
DROP COLUMN "isPublished",
DROP COLUMN "title";

-- CreateTable
CREATE TABLE "form_versions" (
    "id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formId" TEXT NOT NULL,

    CONSTRAINT "form_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_versions_formId_idx" ON "form_versions"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "form_versions_formId_versionNumber_key" ON "form_versions"("formId", "versionNumber");

-- CreateIndex
CREATE INDEX "form_fields_formVersionId_idx" ON "form_fields"("formVersionId");

-- AddForeignKey
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
