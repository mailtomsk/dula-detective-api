/*
  Warnings:

  - You are about to drop the `BarcodeDetails` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "BarcodeDetails";

-- CreateTable
CREATE TABLE "barcode_details" (
    "id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "productName" TEXT,
    "productType" TEXT,
    "brand" TEXT,
    "image_url" TEXT,
    "ingredients" TEXT,
    "nutrition" TEXT,
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barcode_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barcode_details_barcode_key" ON "barcode_details"("barcode");
