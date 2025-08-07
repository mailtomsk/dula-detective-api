/*
  Warnings:

  - You are about to drop the column `produc_type` on the `barcode_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "barcode_details" DROP COLUMN "produc_type",
ADD COLUMN     "product_type" TEXT;
