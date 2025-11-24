-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('PRESENTATION', 'VIDEO', 'LECTURE_MATERIAL');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "material_type" "MaterialType";

-- Set default value for existing rows
UPDATE "lessons" SET "material_type" = 'PRESENTATION' WHERE "material_type" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "lessons" ALTER COLUMN "material_type" SET NOT NULL;
