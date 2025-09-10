-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;
