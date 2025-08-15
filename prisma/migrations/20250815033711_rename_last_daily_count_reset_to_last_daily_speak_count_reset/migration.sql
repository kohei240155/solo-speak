/*
  Warnings:

  - You are about to drop the column `last_speaking_date` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "last_speaking_date",
ADD COLUMN     "last_daily_speak_count_reset_date" TIMESTAMP(3);
