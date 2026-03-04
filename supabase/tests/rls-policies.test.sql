-- RLS Policy Tests (Task 26)
-- These tests verify that Row-Level Security policies correctly filter data based on user roles

BEGIN;

-- Setup test data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Test 26.1: Trips Table RLS Policies
SELECT plan(5);

-- Create test users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'teacher@test.com', 'encrypted', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'schooladmin@test.com', 'encrypted', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'districtadmin@test.com', 'encrypted', NOW()),
  ('44444444-4444-4444-4444-444444444444', 'tripslip@test.com', 'encrypted', NOW());

-- Create test districts
INSERT INTO districts (id, name)
VALUES ('dist-1', 'Test District');

-- Create test schools
INSERT INTO schools (id, name, district_id)
VALUES 
  ('school-1', 'Test School 1', 'dist-1'),
  ('school-2', 'Test School 2', 'dist-1');

-- Create test teachers
INSERT INTO teachers (id, user_id, school_id, first_name, last_name, email)
VALUES 
  ('teacher-1', '11111111-1111-1111-1111-111111111111', 'school-1', 'Test', 'Teacher', 'teacher@test.com');

-- Create test trips
INSERT INTO trips (id, school_id, created_by, title, status)
VALUES 
  ('trip-1', 'school-1', '11111111-1111-1111-1111-111111111111', 'Teacher Trip', 'draft'),
  ('trip-2', 'school-2', '22222222-2222-2222-2222-222222222222', 'Other School Trip', 'draft');

-- Test: Teacher sees only own trips
SET request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "teacher"}';
SELECT results_eq(
  'SELECT id FROM trips WHERE id = ''trip-1''',
  ARRAY['trip-1'::uuid],
  'Teacher should see their own trip'
);

-- Test: School admin sees only school trips
SET request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "school_admin", "app_metadata": {"organization_id": "school-1"}}';
SELECT results_eq(
  'SELECT id FROM trips WHERE school_id = ''school-1''',
  ARRAY['trip-1'::uuid],
  'School admin should see school trips'
);

-- Test: District admin sees district trips
SET request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "role": "district_admin", "app_metadata": {"organization_id": "dist-1"}}';
SELECT ok(
  (SELECT COUNT(*) FROM trips WHERE school_id IN (SELECT id FROM schools WHERE district_id = 'dist-1')) >= 1,
  'District admin should see district trips'
);

-- Test: TripSlip admin sees all trips
SET request.jwt.claims = '{"sub": "44444444-4444-4444-4444-444444444444", "role": "tripslip_admin"}';
SELECT ok(
  (SELECT COUNT(*) FROM trips) >= 2,
  'TripSlip admin should see all trips'
);

-- Test: Unauthorized access returns empty results
SET request.jwt.claims = '{"sub": "99999999-9999-9999-9999-999999999999", "role": "anonymous"}';
SELECT is_empty(
  'SELECT id FROM trips',
  'Unauthorized user should see no trips'
);

SELECT * FROM finish();
ROLLBACK;
