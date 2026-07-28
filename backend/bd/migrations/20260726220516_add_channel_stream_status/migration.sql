-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "stream_status" TEXT,
ADD COLUMN     "stream_checked_at" TIMESTAMP(3);
