# Manual Test Cases - Better Auth RBAC & User Management

## Test Environment Setup
- Ensure database is seeded with at least one SUPER_ADMIN user
- Have test users for each role: SUPER_ADMIN, ADMIN, COORDINATOR, STUDENT
- Have at least 2 universities and 2 departments per university in the database

---

## 1. Create User Button Visibility Tests

### Test 1.1: SUPER_ADMIN sees Create User button
**Prerequisites:** Logged in as SUPER_ADMIN
**Steps:**
1. Navigate to `/admin/users`
2. Check if "Create User" button is visible in the top right

**Expected Result:**
- ✅ "Create User" button is visible
- Button has an icon (plus sign) and text "Create User"
- Button uses default app styling (not bold, no custom colors)

---

### Test 1.2: ADMIN sees Create User button
**Prerequisites:** Logged in as ADMIN
**Steps:**
1. Navigate to `/admin/users`
2. Check if "Create User" button is visible in the top right

**Expected Result:**
- ✅ "Create User" button is visible

---

### Test 1.3: COORDINATOR sees Create User button
**Prerequisites:** Logged in as COORDINATOR
**Steps:**
1. Navigate to `/admin/users`
2. Check if "Create User" button is visible in the top right

**Expected Result:**
- ✅ "Create User" button is visible

---

### Test 1.4: STUDENT does NOT see Create User button
**Prerequisites:** Logged in as STUDENT
**Steps:**
1. Navigate to `/admin/users`
2. Check if "Create User" button is visible

**Expected Result:**
- ❌ "Create User" button is NOT visible
- User should see the users list but no create button

---

## 2. Role Assignment Permissions Tests

### Test 2.1: SUPER_ADMIN can create any role
**Prerequisites:** Logged in as SUPER_ADMIN
**Steps:**
1. Click "Create User" button
2. Check available roles in the "Role" dropdown

**Expected Result:**
- ✅ Dropdown shows: SUPER_ADMIN, ADMIN, COORDINATOR, STUDENT
- All 4 roles are selectable

---

### Test 2.2: ADMIN can only create COORDINATOR and STUDENT
**Prerequisites:** Logged in as ADMIN
**Steps:**
1. Click "Create User" button
2. Check available roles in the "Role" dropdown

**Expected Result:**
- ✅ Dropdown shows: COORDINATOR, STUDENT
- SUPER_ADMIN and ADMIN options are NOT available

---

### Test 2.3: COORDINATOR can only create STUDENT
**Prerequisites:** Logged in as COORDINATOR
**Steps:**
1. Click "Create User" button
2. Check available roles in the "Role" dropdown

**Expected Result:**
- ✅ Dropdown shows: STUDENT only
- No other roles are available

---

## 3. User Creation - Success Scenarios

### Test 3.1: SUPER_ADMIN creates another SUPER_ADMIN
**Prerequisites:** Logged in as SUPER_ADMIN
**Steps:**
1. Click "Create User"
2. Fill in:
   - Email: `superadmin2@test.com`
   - Name: `Super Admin 2`
   - Role: `SUPER_ADMIN`
   - University: `None`
   - Department: `None`
3. Click "Create User" submit button
4. Check for success message

**Expected Result:**
- ✅ User created successfully
- Success message appears
- User appears in the users list
- User has SUPER_ADMIN role

---

### Test 3.2: SUPER_ADMIN creates ADMIN with university assignment
**Prerequisites:** Logged in as SUPER_ADMIN
**Steps:**
1. Click "Create User"
2. Fill in:
   - Email: `admin@smu.edu.sg`
   - Name: `SMU Admin`
   - Role: `ADMIN`
   - University: `SMU - Singapore Management University`
   - Department: `None`
3. Click "Create User" submit button

**Expected Result:**
- ✅ User created successfully
- User has ADMIN role
- User is assigned to SMU (check user list shows university)

---

### Test 3.3: ADMIN creates COORDINATOR with university and department
**Prerequisites:** Logged in as ADMIN
**Steps:**
1. Click "Create User"
2. Fill in:
   - Email: `coordinator@smu.edu.sg`
   - Name: `CS Coordinator`
   - Role: `COORDINATOR`
   - University: `SMU - Singapore Management University`
   - Department: Select a department under SMU
3. Click "Create User" submit button

**Expected Result:**
- ✅ User created successfully
- User has COORDINATOR role
- User is assigned to both university and department

---

### Test 3.4: COORDINATOR creates STUDENT
**Prerequisites:** Logged in as COORDINATOR
**Steps:**
1. Click "Create User"
2. Fill in:
   - Email: `student@smu.edu.sg`
   - Name: `Test Student`
   - Role: `STUDENT`
   - University: `SMU - Singapore Management University`
   - Department: Select a department
3. Click "Create User" submit button

**Expected Result:**
- ✅ User created successfully
- User has STUDENT role

---

## 4. User Creation - Validation Tests

### Test 4.1: Email validation - invalid format
**Prerequisites:** Any admin user logged in
**Steps:**
1. Click "Create User"
2. Fill in email: `invalidemail`
3. Try to submit

**Expected Result:**
- ❌ Form shows validation error for email format
- User is NOT created

---

### Test 4.2: Duplicate email validation
**Prerequisites:** Any admin user logged in with existing user `test@example.com`
**Steps:**
1. Click "Create User"
2. Fill in email: `test@example.com` (existing email)
3. Fill in other required fields
4. Submit form

**Expected Result:**
- ❌ API returns 409 error
- Error message: "User with this email already exists"

---

### Test 4.3: Name validation - empty name
**Prerequisites:** Any admin user logged in
**Steps:**
1. Click "Create User"
2. Leave name field empty
3. Fill in other fields
4. Try to submit

**Expected Result:**
- ❌ Form validation error
- User is NOT created

---

### Test 4.4: University/Department validation
**Prerequisites:** Any admin user logged in
**Steps:**
1. Click "Create User"
2. Select a University
3. Select a Department that belongs to a DIFFERENT university (if possible)
4. Try to submit

**Expected Result:**
- ❌ API returns 400 error
- Error message: "Department does not belong to the specified university"

---

### Test 4.5: Department without university validation
**Prerequisites:** Any admin user logged in
**Steps:**
1. Click "Create User"
2. Fill in required fields
3. Set University to "None"
4. Try to select a Department
5. Submit form

**Expected Result:**
- Either department selector is disabled when university is "None"
- OR API returns 400 error: "University is required when assigning a department"

---

## 5. Permission Denial Tests

### Test 5.1: ADMIN cannot create ADMIN role
**Prerequisites:** Logged in as ADMIN
**Steps:**
1. Manually try to send POST request to `/api/admin/users/create` with:
   ```json
   {
     "email": "newadmin@test.com",
     "name": "New Admin",
     "role": "ADMIN"
   }
   ```

**Expected Result:**
- ❌ API returns 403 Forbidden
- Error message: "ADMIN cannot create users with ADMIN role"
- Details: "You can only create users with these roles: COORDINATOR, STUDENT"

---

### Test 5.2: COORDINATOR cannot create ADMIN role
**Prerequisites:** Logged in as COORDINATOR
**Steps:**
1. Manually try to send POST request to `/api/admin/users/create` with role: "ADMIN"

**Expected Result:**
- ❌ API returns 403 Forbidden
- Error mentions COORDINATOR can only create STUDENT role

---

### Test 5.3: Unauthenticated user cannot access endpoint
**Prerequisites:** Not logged in / logged out
**Steps:**
1. Try to POST to `/api/admin/users/create`

**Expected Result:**
- ❌ API returns 401 or 403
- Error: "Admin access required" or "Unauthorized"

---

## 6. University & Department Data Loading Tests

### Test 6.1: University dropdown loads real data
**Prerequisites:** Logged in as any admin user
**Steps:**
1. Click "Create User"
2. Click on University dropdown
3. Check available options

**Expected Result:**
- ✅ "None" option is available
- ✅ All active universities from database are listed
- Format: `CODE - Full Name` (e.g., "SMU - Singapore Management University")
- Values are real UUIDs (not placeholder strings like "smu-id")

---

### Test 6.2: Department dropdown is disabled when university is "None"
**Prerequisites:** Logged in as any admin user
**Steps:**
1. Click "Create User"
2. Set University to "None"
3. Try to interact with Department dropdown

**Expected Result:**
- ✅ Department dropdown is disabled or shows "Select university first"

---

### Test 6.3: Department dropdown loads based on selected university
**Prerequisites:** Logged in as any admin user
**Steps:**
1. Click "Create User"
2. Select a specific university (e.g., SMU)
3. Check Department dropdown options

**Expected Result:**
- ✅ Department dropdown shows only departments belonging to selected university
- Departments from other universities are NOT shown

---

## 7. API Endpoint Permission Tests

### Test 7.1: COORDINATOR cannot view admin statistics
**Prerequisites:** Logged in as COORDINATOR
**Steps:**
1. Navigate to or fetch `/api/admin/stats`

**Expected Result:**
- ❌ API returns 403 Forbidden
- Error: "You do not have permission to view admin statistics"

---

### Test 7.2: ADMIN can view admin statistics
**Prerequisites:** Logged in as ADMIN
**Steps:**
1. Fetch `/api/admin/stats`

**Expected Result:**
- ✅ API returns 200 OK
- Response includes user counts, course counts, etc.

---

### Test 7.3: All roles can view universities
**Prerequisites:** Test with each role: SUPER_ADMIN, ADMIN, COORDINATOR
**Steps:**
1. Fetch `/api/admin/universities`

**Expected Result:**
- ✅ All admin roles receive 200 OK
- Response includes list of universities

---

### Test 7.4: Department API requires universityId parameter
**Prerequisites:** Logged in as any admin user
**Steps:**
1. Fetch `/api/admin/departments` without universityId query param

**Expected Result:**
- ❌ API returns 400 Bad Request
- Error: "universityId is required"

---

### Test 7.5: Department API with valid universityId
**Prerequisites:** Logged in as any admin user
**Steps:**
1. Get a valid university UUID
2. Fetch `/api/admin/departments?universityId={uuid}`

**Expected Result:**
- ✅ API returns 200 OK
- Response includes departments for that university

---

## 8. Audit Logging Tests

### Test 8.1: User creation is logged
**Prerequisites:** Logged in as SUPER_ADMIN with access to audit logs
**Steps:**
1. Create a new user via the UI
2. Check audit logs (database or audit log viewer)

**Expected Result:**
- ✅ Audit log entry exists with:
  - Action: "CREATE"
  - Entity Type: "USER"
  - Entity ID: (new user's ID)
  - User ID: (creator's ID)
  - Changes: includes "after" snapshot of user
  - Metadata: includes createdRole, assignedToUniversity, assignedToDepartment

---

## 9. Better Auth Integration Tests

### Test 9.1: Session data includes user role
**Prerequisites:** Logged in as any user
**Steps:**
1. Open browser dev tools → Network tab
2. Navigate to `/admin/users`
3. Check that useSession hook retrieves session data
4. Verify session.user.role is present

**Expected Result:**
- ✅ Session data includes user.role property
- Role matches the user's actual role in database
- No 404 errors on session fetch

---

### Test 9.2: Session hook updates on login/logout
**Prerequisites:** Not logged in
**Steps:**
1. Navigate to `/admin/users`
2. Verify "Create User" button is not visible
3. Log in as ADMIN
4. Check button appears without page refresh (if using client-side routing)

**Expected Result:**
- ✅ Button visibility updates based on session state
- Session hook properly tracks authentication state

---

## 10. Edge Cases

### Test 10.1: Long university/department names
**Prerequisites:** Database has university with very long name
**Steps:**
1. Open "Create User" modal
2. Check if long names are properly displayed in dropdown

**Expected Result:**
- ✅ Long names don't break layout
- Text is truncated or wrapped appropriately

---

### Test 10.2: Multiple concurrent user creations
**Prerequisites:** Logged in as SUPER_ADMIN
**Steps:**
1. Open "Create User" in two browser tabs
2. Create two different users simultaneously
3. Check both are created successfully

**Expected Result:**
- ✅ Both users are created
- No race conditions or conflicts

---

### Test 10.3: Special characters in user name
**Prerequisites:** Any admin user logged in
**Steps:**
1. Create user with name containing special characters: `O'Brien-Smith (Testing)`

**Expected Result:**
- ✅ User created successfully
- Name is stored and displayed correctly

---

## Testing Checklist Summary

### Critical Path (Must Pass)
- [ ] SUPER_ADMIN can create all role types
- [ ] ADMIN can create COORDINATOR and STUDENT only
- [ ] COORDINATOR can create STUDENT only
- [ ] STUDENT cannot access user creation
- [ ] University dropdown loads real UUIDs
- [ ] Department validation prevents mismatched university/department
- [ ] Duplicate email is rejected
- [ ] Session integration works without 404 errors

### Important (Should Pass)
- [ ] Button visibility matches role permissions
- [ ] All validation errors display properly
- [ ] Permission denials return 403 with clear messages
- [ ] Audit logs are created for user creation
- [ ] API permission checks work for all endpoints

### Nice to Have (Edge Cases)
- [ ] Long names display correctly
- [ ] Special characters in names work
- [ ] Concurrent user creation works
- [ ] Form state resets after successful creation

---

## Test Data Setup

### Required Test Users
```
SUPER_ADMIN: superadmin@test.com
ADMIN: admin@test.com
COORDINATOR: coordinator@test.com
STUDENT: student@test.com
```

### Required Universities
```
- SMU (Singapore Management University)
- NUS (National University of Singapore)
```

### Required Departments (per university)
```
SMU:
  - Computer Science
  - Business Analytics

NUS:
  - Computer Science
  - Engineering
```

---

## Bug Reporting Template

If any test fails, report using this format:

```
Test Case: [Test number and name]
User Role: [SUPER_ADMIN/ADMIN/COORDINATOR/STUDENT]
Steps to Reproduce:
1. ...
2. ...

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots/Logs:
[Attach if applicable]

Browser: [Chrome/Firefox/Safari/etc.]
Date Tested: [YYYY-MM-DD]
```
