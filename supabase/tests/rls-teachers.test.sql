-- RLS Policy Tests for Teachers Table (Task 26.5)

BEGIN;

SELECT plan(3);

-- Setup test data
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES 
  ('schooladmin-user', 'schooladmin@test.com', 'encrypted', NOW()),
  ('districtadmin-user', 'districtadmin@test.com', 'encrypted', NOW());

INSERT INTO districts (id, name) VALUES ('dist-1', 'Test District');
INSERT INTO schools (id, name, district_id) VALUES 
  ('school-1', 'Test School 1', 'dist-1'),
  ('school-2', 'Test School 2', 'dist-1');

INSERT INTO teachers (id, user_id, school_id, first_name, last_name, email)
VALUES 
  ('teacher-1', 'teacher-user-1', 'school-1', 'Test', 'Teacher1', 'teacher1@test.com'),
  ('teacher-2', 'teacher-user-2', 'school-2', 'Test', 'Teacher2', 'teacher2@test.com');

-- Test: School admin sees teachers in their school
SET request.jwt.claims = '{"sub": "schooladmin-user", "role": "school_admin", "app_metadata": {"organization_id": "school-1"}}';
SELECT results_eq(
  'SELECT id FROM teachers WHERE school_id = ''school-1''',
  ARRAY['teacher-1'::uuid],
  'School admin should see teachers in their school'
);

-- Test: District admin sees teachers in district schools
SET request.jwt.claims = '{"sub": "districtadmin-user", "role": "district_admin", "app_metadata": {"organization_id": "dist-1"}}';
SELECT ok(
  (SELECT COUNT(*) FROM teachers WHERE school_id IN (
    SELECT id FROM schools WHERE district_id = 'dist-1'
  )) = 2,
  'District admin should see teachers in district schools'
);

-- Test: Unauthorized access returns empty results
SET request.jwt.claims = '{"sub": "unauthorized-user", "role": "anonymous"}';
SELECT is_empty(
  'SELECT id FROM teachers',
  'Unauthorized user should see no teachers'
);

SELECT * FROM finish();
ROLLBACK;
