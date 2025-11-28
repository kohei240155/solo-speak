-- AlterTable
ALTER TABLE "phrases" ADD COLUMN     "speech_id" TEXT,
ADD COLUMN     "speech_order" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "remaining_speech_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "speeches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "learning_language_id" TEXT NOT NULL,
    "native_language_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "first_speech_text" TEXT NOT NULL,
    "audio_file_path" TEXT,
    "notes" TEXT,
    "practice_count" INTEGER NOT NULL DEFAULT 0,
    "last_practiced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "speeches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speech_feedbacks" (
    "id" TEXT NOT NULL,
    "speech_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "speech_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speech_plans" (
    "id" TEXT NOT NULL,
    "speech_id" TEXT NOT NULL,
    "planning_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "speech_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speech_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "speech_statuses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "phrases" ADD CONSTRAINT "phrases_speech_id_fkey" FOREIGN KEY ("speech_id") REFERENCES "speeches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_learning_language_id_fkey" FOREIGN KEY ("learning_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_native_language_id_fkey" FOREIGN KEY ("native_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "speech_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speech_feedbacks" ADD CONSTRAINT "speech_feedbacks_speech_id_fkey" FOREIGN KEY ("speech_id") REFERENCES "speeches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speech_plans" ADD CONSTRAINT "speech_plans_speech_id_fkey" FOREIGN KEY ("speech_id") REFERENCES "speeches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
