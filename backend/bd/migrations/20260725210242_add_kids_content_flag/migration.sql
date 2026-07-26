-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "is_kids" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "series" ADD COLUMN     "is_kids" BOOLEAN NOT NULL DEFAULT false;
