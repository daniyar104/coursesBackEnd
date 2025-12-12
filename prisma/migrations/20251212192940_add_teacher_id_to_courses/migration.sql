-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "teacher_id" VARCHAR(16);

-- CreateIndex
CREATE INDEX "idx_courses_teacher" ON "courses"("teacher_id");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
