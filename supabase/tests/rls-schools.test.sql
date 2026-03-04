-- RLS Policy Tests for Schools Table (Task 26.3)

BEGIN;

SELECT plan(4);

-- Setup test data
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES 
  ('schooladmin-user', 'schooladmin@test.com', 'encrypted', NOW()),
  ('districtadmin-user', 'districtadmin@test.com', 'encrypted', NOW()),
  ('teacher-user', 'teacher@test.com', 'encrypted', NOW());

INSERT INTO districts (id, name) VALUES ('dist-1', 'Test District');
INSERT INTO schools (id, name, district_id) VALUES 
  ('school-1', 'Test School 1', 'dist-1'),
  ('school-2', 'Test School 2', 'dist-1');

INSERT INTO teachers (id, user_id, school_id, first_name, last_name, email)
VALUES ('teacher-1', 'teacher-user', 'school-1', 'Test', 'Teacher', 'teacher@test.com');

-- Test: School admin sees only their school
SET request.jwt.claims = '{"sub": "schooladmin-user", "role": "school_admin", "app_metadata": {"organization_id": "school-1"}}';
SELECT results_eq(
  'SELECT id FROM schools WHERE id = ''school-1''',
  ARRAY['school-1'::uuid],
  'School admin should see only their school'
);

-- Test: District admin sees district schools
SET request.jwt.claims = '{"sub": "districtadmin-user", "role": "district_admin", "app_metadata": {"organization_id": "dist-1"}}';
SELECT ok(
  (SELECT COUNT(*) FROM schools WHERE district_id = 'dist-1') = 2,
  'District admin should see all district schools'
);

-- Test: Teacher sees their school
SET request.jwt.claims = '{"sub": "teacher-user", "role": "teacher"}';
SELECT results_eq(
  'SELECT id FROM schools WHERE id IN (SELECT school_id FROM teachers WHERE user_id = ''teacher-user'')',
  ARRAY['school-1'::uuid],
  'Teacher should see their school'
);

-- Test: Unauthorized access returns empty results
SET request.jwt.claims = '{"sub": "unauthorized-user", "role": "anonymous"}';
SELECT is_empty(
  'SELECT id FROM schools',
  'Unauthorized user should see no schools'
);

SELECT * FROM finish();
ROLLBACK;
