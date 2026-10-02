-- CreateEnum
CREATE TYPE "LoginStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "login_logs" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "status" "LoginStatus" NOT NULL DEFAULT 'SUCCESS';
