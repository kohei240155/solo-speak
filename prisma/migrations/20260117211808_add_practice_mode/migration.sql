-- AlterTable
ALTER TABLE "phrases" ADD COLUMN     "last_practice_date" TIMESTAMP(3),
ADD COLUMN     "practice_correct_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practice_incorrect_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phrase_mode" TEXT NOT NULL DEFAULT 'practice',
ADD COLUMN     "practice_include_existing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "practice_start_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "practice_logs" (
    "id" TEXT NOT NULL,
    "phrase_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "transcript" TEXT,
    "practice_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "practice_logs_phrase_id_idx" ON "practice_logs"("phrase_id");

-- CreateIndex
CREATE INDEX "practice_logs_user_id_idx" ON "practice_logs"("user_id");

-- CreateIndex
CREATE INDEX "practice_logs_user_id_practice_date_idx" ON "practice_logs"("user_id", "practice_date");

-- AddForeignKey
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "phrases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
