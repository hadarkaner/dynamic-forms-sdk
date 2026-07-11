-- AlterTable
ALTER TABLE "form_fields" ADD COLUMN     "correctOptions" JSONB;

-- AlterTable
ALTER TABLE "form_versions" ADD COLUMN     "theme" JSONB;
