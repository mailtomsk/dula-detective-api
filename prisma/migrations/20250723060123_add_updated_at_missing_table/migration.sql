-- AlterTable
ALTER TABLE "InsightArticle" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScanAnalysis" ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScanHistory" ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updated_at" DROP NOT NULL;
