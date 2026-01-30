-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'COORDINATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('COMPLETED', 'IN_PROGRESS', 'PLANNED');

-- CreateEnum
CREATE TYPE "PrerequisiteType" AS ENUM ('HARD', 'SOFT', 'COREQUISITE');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('PLANNED', 'ENROLLED', 'DROPPED');

-- CreateEnum
CREATE TYPE "University" AS ENUM ('SMU', 'NUS', 'NTU', 'SUTD', 'SUSS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "name" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id" TEXT,
    "university" "University" NOT NULL,
    "major" TEXT NOT NULL,
    "second_major" TEXT,
    "minor" TEXT,
    "year" INTEGER NOT NULL,
    "enrollment_year" INTEGER NOT NULL,
    "expected_graduation_year" INTEGER NOT NULL,
    "gpa" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "university" "University" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "terms_offered" TEXT[],
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prerequisites" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "prerequisite_course_id" TEXT NOT NULL,
    "type" "PrerequisiteType" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completed_courses" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completed_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester_plans" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semester_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_courses" (
    "id" TEXT NOT NULL,
    "semester_plan_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'PLANNED',
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graduation_requirements" (
    "id" TEXT NOT NULL,
    "university" "University" NOT NULL,
    "major" TEXT NOT NULL,
    "requirement_type" TEXT NOT NULL,
    "requirement_value" JSONB NOT NULL,

    CONSTRAINT "graduation_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_university_key" ON "courses"("code", "university");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequisites" ADD CONSTRAINT "prerequisites_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequisites" ADD CONSTRAINT "prerequisites_prerequisite_course_id_fkey" FOREIGN KEY ("prerequisite_course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_courses" ADD CONSTRAINT "completed_courses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_courses" ADD CONSTRAINT "completed_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_plans" ADD CONSTRAINT "semester_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_courses" ADD CONSTRAINT "planned_courses_semester_plan_id_fkey" FOREIGN KEY ("semester_plan_id") REFERENCES "semester_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_courses" ADD CONSTRAINT "planned_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
