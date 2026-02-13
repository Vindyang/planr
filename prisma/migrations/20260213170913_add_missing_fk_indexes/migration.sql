-- CreateIndex
CREATE INDEX "completed_courses_student_id_idx" ON "completed_courses"("student_id");

-- CreateIndex
CREATE INDEX "completed_courses_course_id_idx" ON "completed_courses"("course_id");

-- CreateIndex
CREATE INDEX "course_reviews_course_id_idx" ON "course_reviews"("course_id");

-- CreateIndex
CREATE INDEX "planned_courses_semester_plan_id_idx" ON "planned_courses"("semester_plan_id");

-- CreateIndex
CREATE INDEX "planned_courses_course_id_idx" ON "planned_courses"("course_id");

-- CreateIndex
CREATE INDEX "prerequisites_course_id_idx" ON "prerequisites"("course_id");

-- CreateIndex
CREATE INDEX "prerequisites_prerequisite_course_id_idx" ON "prerequisites"("prerequisite_course_id");

-- CreateIndex
CREATE INDEX "professor_reviews_professor_id_idx" ON "professor_reviews"("professor_id");

-- CreateIndex
CREATE INDEX "professor_reviews_course_id_idx" ON "professor_reviews"("course_id");

-- CreateIndex
CREATE INDEX "semester_plans_student_id_idx" ON "semester_plans"("student_id");
