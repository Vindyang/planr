-- CreateTable
CREATE TABLE "professors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "university" "University" NOT NULL,
    "department" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_instructors" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "term" TEXT,

    CONSTRAINT "course_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "difficulty_rating" INTEGER NOT NULL,
    "workload_rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professor_reviews" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "course_id" TEXT,
    "rating" INTEGER NOT NULL,
    "difficulty_rating" INTEGER NOT NULL,
    "workload_rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "term" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professors_name_university_department_key" ON "professors"("name", "university", "department");

-- CreateIndex
CREATE UNIQUE INDEX "course_instructors_course_id_professor_id_term_key" ON "course_instructors"("course_id", "professor_id", "term");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_student_id_course_id_key" ON "course_reviews"("student_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "professor_reviews_student_id_professor_id_key" ON "professor_reviews"("student_id", "professor_id");

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor_reviews" ADD CONSTRAINT "professor_reviews_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor_reviews" ADD CONSTRAINT "professor_reviews_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor_reviews" ADD CONSTRAINT "professor_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
