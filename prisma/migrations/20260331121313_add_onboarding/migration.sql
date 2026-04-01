-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_first_login" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "onboarding_status" JSONB;
