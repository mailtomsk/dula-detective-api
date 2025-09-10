/*
  Warnings:

  - The `aiResponse` column on the `BarcodeDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "BarcodeDetails" DROP COLUMN "aiResponse",
ADD COLUMN     "aiResponse" JSONB;
