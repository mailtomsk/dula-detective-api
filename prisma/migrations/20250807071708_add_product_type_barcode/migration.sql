/*
  Warnings:

  - You are about to drop the column `productName` on the `barcode_details` table. All the data in the column will be lost.
  - You are about to drop the column `productType` on the `barcode_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "barcode_details" DROP COLUMN "productName",
DROP COLUMN "productType",
ADD COLUMN     "produc_type" TEXT,
ADD COLUMN     "product_name" TEXT;
