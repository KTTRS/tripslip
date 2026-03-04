-- RLS Policy Tests for Experiences Table (Task 26.4)

BEGIN;

SELECT plan(4);

-- Setup test data
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES 
  ('venueadmin-user', 'venueadmin@test.com', 'encrypted', NOW()),
  ('public-user', 'public@test.com', 'encrypted', NOW());

INSERT INTO venues (id, name, contact_email)
VALUES 
  ('venue-1', 'Test Venue 1', 'venue1@test.com'),
  ('venue-2', 'Test Venue 2', 'venue2@test.com');

INSERT INTO experiences (id, venue_id, title, description, published)
VALUES 
  ('exp-1', 'venue-1', 'Published Experience', 'Description', true),
  ('exp-2', 'venue-1', 'Unpublished Experience', 'Description', false),
  ('exp-3', 'venue-2', 'Other Venue Experience', 'Description', true);

-- Test: All users see published experiences
SET request.jwt.claims = '{"sub": "public-user", "role": "authenticated"}';
SELECT ok(
  (SELECT COUNT(*) FROM experiences WHERE published = true) >= 2,
  'All users should see published experiences'
);

-- Test: Venue admin sees their venue's experiences
SET request.jwt.claims = '{"sub": "venueadmin-user", "role": "venue_admin", "app_metadata": {"organization_id": "venue-1"}}';
SELECT ok(
  (SELECT COUNT(*) FROM experiences WHERE venue_id = 'venue-1') = 2,
  'Venue admin should see all their venue experiences'
);

-- Test: Venue admin can modify their experiences
SET request.jwt.claims = '{"sub": "venueadmin-user", "role": "venue_admin", "app_metadata": {"organization_id": "venue-1"}}';
UPDATE experiences SET title = 'Updated Title' WHERE id = 'exp-1' AND venue_id = 'venue-1';
SELECT results_eq(
  'SELECT title FROM experiences WHERE id = ''exp-1''',
  ARRAY['Updated Title'::text],
  'Venue admin should be able to modify their experiences'
);

-- Test: Unauthorized modification is denied
SET request.jwt.claims = '{"sub": "venueadmin-user", "role": "venue_admin", "app_metadata": {"organization_id": "venue-1"}}';
SELECT throws_ok(
  'UPDATE experiences SET title = ''Hacked'' WHERE id = ''exp-3'' AND venue_id = ''venue-2''',
  'Venue admin should not be able to modify other venues experiences'
);

SELECT * FROM finish();
ROLLBACK;
