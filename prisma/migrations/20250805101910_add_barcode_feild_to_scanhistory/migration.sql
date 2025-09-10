-- AlterTable
ALTER TABLE "ScanHistory" ADD COLUMN     "barcode" TEXT,
ALTER COLUMN "image_path" DROP NOT NULL;
