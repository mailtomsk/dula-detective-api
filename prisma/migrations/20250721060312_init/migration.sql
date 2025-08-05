-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "profile_image" TEXT,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "dark_mode" BOOLEAN NOT NULL DEFAULT false,
    "default_analysis_type" TEXT NOT NULL DEFAULT 'human',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanHistory" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "image_path" TEXT NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanAnalysis" (
    "id" SERIAL NOT NULL,
    "analysis_id" TEXT,
    "user_id" INTEGER,
    "analysis_type" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "overall_status" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "processing_time" DOUBLE PRECISION NOT NULL,
    "ingredients" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "recommendations" TEXT[],
    "allergens" TEXT[],
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightArticle" (
    "id" SERIAL NOT NULL,
    "article_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "read_time" INTEGER NOT NULL,
    "image_path" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "author_name" TEXT,
    "author_bio" TEXT,
    "tags" TEXT[],

    CONSTRAINT "InsightArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_user_id_key" ON "PasswordResetToken"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ScanAnalysis_analysis_id_key" ON "ScanAnalysis"("analysis_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsightArticle_article_id_key" ON "InsightArticle"("article_id");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanAnalysis" ADD CONSTRAINT "ScanAnalysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
