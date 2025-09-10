-- CreateTable
CREATE TABLE "BarcodeDetails" (
    "id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "productName" TEXT,
    "brand" TEXT,
    "image_url" TEXT,
    "ingredients" TEXT,
    "nutrition" TEXT,
    "aiResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarcodeDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarcodeDetails_barcode_key" ON "BarcodeDetails"("barcode");
