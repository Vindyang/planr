-- CreateIndex
CREATE INDEX "courses_university_is_active_idx" ON "courses"("university", "is_active");

-- CreateIndex
CREATE INDEX "semester_plans_student_id_year_term_idx" ON "semester_plans"("student_id", "year", "term");
