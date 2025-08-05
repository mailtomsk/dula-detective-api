-- AlterTable
ALTER TABLE "InsightArticle" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "image_path" DROP NOT NULL;
