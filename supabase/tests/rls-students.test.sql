-- RLS Policy Tests for Students Table (Task 26.2)

BEGIN;

SELECT plan(5);

-- Setup test data
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES 
  ('teacher-user', 'teacher@test.com', 'encrypted', NOW()),
  ('schooladmin-user', 'schooladmin@test.com', 'encrypted', NOW()),
  ('districtadmin-user', 'districtadmin@test.com', 'encrypted', NOW()),
  ('parent-user', 'parent@test.com', 'encrypted', NOW());

INSERT INTO districts (id, name) VALUES ('dist-1', 'Test District');
INSERT INTO schools (id, name, district_id) VALUES ('school-1', 'Test School', 'dist-1');
INSERT INTO teachers (id, user_id, school_id, first_name, last_name, email)
VALUES ('teacher-1', 'teacher-user', 'school-1', 'Test', 'Teacher', 'teacher@test.com');

INSERT INTO rosters (id, teacher_id, name, school_year)
VALUES ('roster-1', 'teacher-1', 'Test Roster', '2024-2025');

INSERT INTO students (id, roster_id, first_name, last_name)
VALUES ('student-1', 'roster-1', 'Test', 'Student');

-- Test: Teacher sees students in their rosters
SET request.jwt.claims = '{"sub": "teacher-user", "role": "teacher"}';
SELECT results_eq(
  'SELECT id FROM students WHERE roster_id = ''roster-1''',
  ARRAY['student-1'::uuid],
  'Teacher should see students in their roster'
);

-- Test: School admin sees school students
SET request.jwt.claims = '{"sub": "schooladmin-user", "role": "school_admin", "app_metadata": {"organization_id": "school-1"}}';
SELECT ok(
  (SELECT COUNT(*) FROM students WHERE roster_id IN (
    SELECT r.id FROM rosters r
    JOIN teachers t ON r.teacher_id = t.id
    WHERE t.school_id = 'school-1'
  )) >= 1,
  'School admin should see school students'
);

-- Test: District admin sees district students
SET request.jwt.claims = '{"sub": "districtadmin-user", "role": "district_admin", "app_metadata": {"organization_id": "dist-1"}}';
SELECT ok(
  (SELECT COUNT(*) FROM students WHERE roster_id IN (
    SELECT r.id FROM rosters r
    JOIN teachers t ON r.teacher_id = t.id
    JOIN schools s ON t.school_id = s.id
    WHERE s.district_id = 'dist-1'
  )) >= 1,
  'District admin should see district students'
);

-- Test: Parent sees their children
INSERT INTO parents (id, user_id, email) VALUES ('parent-1', 'parent-user', 'parent@test.com');
INSERT INTO student_parents (student_id, parent_id) VALUES ('student-1', 'parent-1');

SET request.jwt.claims = '{"sub": "parent-user", "role": "parent"}';
SELECT results_eq(
  'SELECT id FROM students WHERE id IN (
    SELECT student_id FROM student_parents WHERE parent_id = ''parent-1''
  )',
  ARRAY['student-1'::uuid],
  'Parent should see their children'
);

-- Test: Unauthorized access returns empty results
SET request.jwt.claims = '{"sub": "unauthorized-user", "role": "anonymous"}';
SELECT is_empty(
  'SELECT id FROM students',
  'Unauthorized user should see no students'
);

SELECT * FROM finish();
ROLLBACK;
