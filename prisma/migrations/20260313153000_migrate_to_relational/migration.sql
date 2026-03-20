-- DropIndex
DROP INDEX "courses_code_university_key";

-- DropIndex
DROP INDEX "courses_university_is_active_idx";

-- DropIndex
DROP INDEX "professors_name_university_department_key";

-- DropIndex
DROP INDEX "users_assigned_university_assigned_department_idx";

-- DropIndex
DROP INDEX "users_assigned_university_idx";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "university",
ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "university_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "graduation_requirements" DROP COLUMN "university",
ADD COLUMN     "university_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "professors" DROP COLUMN "department",
DROP COLUMN "university",
ADD COLUMN     "department_id" TEXT NOT NULL,
ADD COLUMN     "university_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "major",
DROP COLUMN "minor",
DROP COLUMN "second_major",
DROP COLUMN "university",
ADD COLUMN     "major_id" TEXT NOT NULL,
ADD COLUMN     "minor_id" TEXT,
ADD COLUMN     "second_major_id" TEXT,
ADD COLUMN     "university_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "assigned_department",
DROP COLUMN "assigned_university",
ADD COLUMN     "assigned_department_id" TEXT,
ADD COLUMN     "assigned_university_id" TEXT;

-- DropEnum
DROP TYPE "University";

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universities_code_key" ON "universities"("code");

-- CreateIndex
CREATE INDEX "departments_university_id_is_active_idx" ON "departments"("university_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "departments_university_id_code_key" ON "departments"("university_id", "code");

-- CreateIndex
CREATE INDEX "courses_university_id_is_active_idx" ON "courses"("university_id", "is_active");

-- CreateIndex
CREATE INDEX "courses_department_id_idx" ON "courses"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_university_id_key" ON "courses"("code", "university_id");

-- CreateIndex
CREATE INDEX "graduation_requirements_university_id_major_idx" ON "graduation_requirements"("university_id", "major");

-- CreateIndex
CREATE INDEX "professors_university_id_idx" ON "professors"("university_id");

-- CreateIndex
CREATE INDEX "professors_department_id_idx" ON "professors"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "professors_name_university_id_department_id_key" ON "professors"("name", "university_id", "department_id");

-- CreateIndex
CREATE INDEX "students_university_id_idx" ON "students"("university_id");

-- CreateIndex
CREATE INDEX "students_major_id_idx" ON "students"("major_id");

-- CreateIndex
CREATE INDEX "users_assigned_university_id_idx" ON "users"("assigned_university_id");

-- CreateIndex
CREATE INDEX "users_assigned_university_id_assigned_department_id_idx" ON "users"("assigned_university_id", "assigned_department_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assigned_university_id_fkey" FOREIGN KEY ("assigned_university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assigned_department_id_fkey" FOREIGN KEY ("assigned_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_second_major_id_fkey" FOREIGN KEY ("second_major_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_minor_id_fkey" FOREIGN KEY ("minor_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graduation_requirements" ADD CONSTRAINT "graduation_requirements_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professors" ADD CONSTRAINT "professors_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professors" ADD CONSTRAINT "professors_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

