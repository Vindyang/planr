# Manual Testing Guide

This document provides comprehensive test accounts and testing procedures for the Planr application.

## Test Accounts

All test accounts use the password: `password123`

### 1. Freshman (Fresh Start)
- **Email**: `freshman@smu.edu.sg`
- **Password**: `password123`
- **Profile**: Year 1, GPA 0.0, 0 completed courses
- **Test Cases**:
  - Only Year 1 courses should appear as eligible
  - Dashboard should show 0 completed courses
  - Planner should allow adding only foundation courses

### 2. Sophomore (Standard Progress)
- **Email**: `sophomore@smu.edu.sg`
- **Password**: `password123`
- **Profile**: Year 2, GPA 3.5, 8 completed courses
- **Completed Courses**: CS101, CS102, MATH101, MATH102, IS101, COMM101, STAT101, MATH103
- **Test Cases**:
  - Year 2 courses (CS201, CS202, CS203, etc.) should be eligible
  - Dashboard should show correct GPA (3.5) and course count (8)
  - Course detail pages should show prerequisites as met

### 3. Junior (Advanced Progress)
- **Email**: `junior@smu.edu.sg`
- **Password**: `password123`
- **Profile**: Year 3, GPA 3.7, 20 completed courses
- **Completed Courses**: All Year 1 and Year 2 core courses, plus CS301, CS302
- **Test Cases**:
  - Year 3 and track-specific courses should be eligible
  - Can select specialization track courses
  - Multi-prerequisite courses (requiring both CS201 AND CS202) should show as eligible

### 4. Senior (Near Graduation)
- **Email**: `senior@smu.edu.sg`
- **Password**: `password123`
- **Profile**: Year 4, GPA 3.8, 32 completed courses
- **Completed Courses**: Year 1-3 complete, started Software Engineering track
- **Test Cases**:
  - Should see eligibility for capstone courses (CS490-CS494)
  - Track-specific advanced courses should be available
  - Dashboard should show near-completion status

### 5. Struggling Student (Grade Deficiency)
- **Email**: `struggling@smu.edu.sg`
- **Password**: `password123`
- **Profile**: Year 3, GPA 2.3, 12 completed courses
- **Completed Courses**: Behind schedule, **D grade in CS102**
- **Test Cases**:
  - **CRITICAL**: CS201 should show grade deficiency warning (requires C or better in CS102)
  - Lower GPA should be accurately displayed
  - Should demonstrate soft prerequisite warnings

### 6. NUS Student (Multi-University)
- **Email**: `nus-student@nus.edu.sg`
- **Password**: `password123`
- **Profile**: Year 2 NUS, GPA 3.6, 10 completed courses
- **Completed Courses**: NUS Year 1 courses (CS1101S, CS1231, MA1521, etc.)
- **Test Cases**:
  - **CRITICAL**: Should ONLY see NUS courses in catalog
  - Should NOT see SMU courses
  - Course eligibility should work with NUS prerequisite structure

---

## Testing Checklist

### Authentication & Authorization
- [ ] Can sign up new account
- [ ] Can log in with test accounts
- [ ] Password reset flow works
- [ ] Cannot access authenticated routes without login
- [ ] Session persists across page reloads

### Profile Management
- [ ] Profile page displays correct student information
- [ ] Can update profile fields
- [ ] University field is correctly displayed
- [ ] Graduation year calculates correctly

### Course Browsing & Search
- [ ] Course catalog loads all courses for student's university
- [ ] Search filters courses by code/title
- [ ] University filter works (NUS student sees only NUS courses)
- [ ] Tags filter courses correctly
- [ ] Course cards display correct information

### Course Detail Pages
- [ ] Course detail page loads with correct information
- [ ] Prerequisites are displayed
- [ ] "Add to Plan" button appears
- [ ] Eligibility status shows correctly:
  - ✅ Green for eligible
  - ⚠️ Yellow for soft prerequisite warnings
  - ❌ Red for hard prerequisite not met or grade deficiency

### Eligibility System
- [ ] **Freshman**: Only Year 1 courses eligible
- [ ] **Sophomore**: Year 2 courses eligible after completing prerequisites
- [ ] **Junior**: Advanced courses eligible with proper prerequisites
- [ ] **Struggling**: CS201 shows grade deficiency warning (D in CS102)
- [ ] **Multi-prerequisite**: Courses requiring multiple prerequisites only eligible when ALL met
- [ ] **Soft prerequisites**: Shows warning but allows planning
- [ ] **Corequisites**: Can be taken together

### Planner Functionality
- [ ] Can create new semester plan
- [ ] Semesters are organized by year
- [ ] Can drag and drop courses between semesters
- [ ] Can add courses from course detail pages
- [ ] Can remove courses from plan
- [ ] Validation panel shows errors/warnings
- [ ] **Prerequisite violations** highlighted in validation
- [ ] **Unit limits** enforced per semester
- [ ] Can rearrange courses between semesters

### Dashboard Widgets
- [ ] Shows correct number of completed courses
- [ ] GPA calculated and displayed accurately
- [ ] Shows remaining courses to graduate
- [ ] Eligible courses count is accurate
- [ ] Quick actions work (Browse Courses, Open Planner)
- [ ] Recent activity displays

### Multi-Semester Planner
- [ ] Can plan multiple semesters
- [ ] Course dependencies visualized across semesters
- [ ] Can view entire 4-year plan
- [ ] Semester validation checks prerequisites are met in prior semesters
- [ ] Can export/print plan

### Navigation & UX
- [ ] Sidebar navigation works
- [ ] Active route highlighted correctly
- [ ] Breadcrumbs show current location
- [ ] Keyboard shortcut `/` focuses search
- [ ] Toast notifications appear for actions (success/error)
- [ ] Loading states show skeleton screens
- [ ] Error boundaries catch and display errors gracefully

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Sidebar collapses on mobile
- [ ] Touch interactions work on mobile

### Performance
- [ ] Course catalog loads within 2 seconds
- [ ] Search is responsive (< 300ms)
- [ ] Planner drag-and-drop is smooth
- [ ] No layout shifts during loading

---

## Test Data Summary

### Courses
- **Total**: 155 courses
- **SMU**: 105 courses
  - Year 1 Foundation: 15 courses
  - Year 2 Core: 15 courses
  - Year 3 Advanced: 15 courses
  - Software Engineering Track: 10 courses
  - Data Science & AI Track: 10 courses
  - Cybersecurity Track: 10 courses
  - Systems & Networks Track: 10 courses
  - General Electives: 15 courses
  - Capstone: 5 courses
- **NUS**: 50 courses

### Prerequisites
- **Total**: 133 prerequisite relationships
- **Types**:
  - HARD: ~70% (must complete with minimum grade)
  - SOFT: ~20% (recommended but not required)
  - COREQUISITE: ~10% (can take simultaneously)

### Test Students
- **Total**: 6 students
- **Universities**: SMU (5), NUS (1)
- **Year Levels**: 1, 2, 3, 4
- **GPA Range**: 0.0 - 3.8
- **Completed Courses**: 0 - 32 courses

---

## Known Test Scenarios

### Grade Deficiency Test
1. Login as `struggling@smu.edu.sg`
2. Navigate to CS201 course page
3. **Expected**: Should see warning about D grade in CS102 (requires C or better)
4. Attempt to add to planner
5. **Expected**: Should show warning in validation panel

### Multi-University Isolation Test
1. Login as `nus-student@nus.edu.sg`
2. Navigate to Courses page
3. **Expected**: Should only see 50 NUS courses
4. Search for "CS101" (SMU course)
5. **Expected**: Should return no results

### Complex Prerequisite Test
1. Login as `sophomore@smu.edu.sg`
2. Navigate to CS301 course page
3. **Expected**: Should show as NOT eligible (requires both CS201 AND CS202)
4. Login as `junior@smu.edu.sg`
5. Navigate to CS301 course page
6. **Expected**: Should show as eligible (has both prerequisites)

### Corequisite Test
1. Login as `freshman@smu.edu.sg`
2. Create semester plan for Fall 2025
3. Add CS201 to plan
4. **Expected**: Should allow adding CS202 in same semester (corequisite)

---

## Reporting Issues

When reporting bugs, please include:
1. Test account used
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser and device information

---

## Next Steps After Testing

After completing manual testing:
1. Document any bugs found
2. Verify all eligibility rules work correctly
3. Test with different browsers (Chrome, Firefox, Safari, Edge)
4. Test on different devices (desktop, tablet, mobile)
5. Proceed to Step 10: Responsive Design & Mobile Optimization
