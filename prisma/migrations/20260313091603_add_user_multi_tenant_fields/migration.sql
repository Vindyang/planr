-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assigned_department" TEXT,
ADD COLUMN     "assigned_university" "University";

-- CreateIndex
CREATE INDEX "users_assigned_university_idx" ON "users"("assigned_university");

-- CreateIndex
CREATE INDEX "users_assigned_university_assigned_department_idx" ON "users"("assigned_university", "assigned_department");
