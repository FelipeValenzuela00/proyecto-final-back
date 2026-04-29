/*
  Warnings:

  - You are about to drop the column `activityType` on the `daily_activities` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `daily_activities` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `daily_activities` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `daily_activities` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `daily_activities` table. All the data in the column will be lost.
  - You are about to drop the column `aiSummary` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `finalContent` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `reportDate` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `activity_type` to the `daily_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `daily_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `daily_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `daily_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `report_date` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "daily_activities" DROP CONSTRAINT "daily_activities_userId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_userId_fkey";

-- DropIndex
DROP INDEX "users_googleId_key";

-- AlterTable
ALTER TABLE "daily_activities" DROP COLUMN "activityType",
DROP COLUMN "createdAt",
DROP COLUMN "endTime",
DROP COLUMN "startTime",
DROP COLUMN "userId",
ADD COLUMN     "activity_type" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "aiSummary",
DROP COLUMN "finalContent",
DROP COLUMN "reportDate",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "ai_summary" TEXT,
ADD COLUMN     "final_content" TEXT,
ADD COLUMN     "report_date" DATE NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "fullName",
DROP COLUMN "googleId",
DROP COLUMN "refreshToken",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "refresh_token" TEXT;

-- CreateIndex
CREATE INDEX "daily_activities_user_id_start_time_idx" ON "daily_activities"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "reports_user_id_report_date_idx" ON "reports"("user_id", "report_date");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
