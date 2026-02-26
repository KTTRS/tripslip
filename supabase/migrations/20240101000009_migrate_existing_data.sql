-- Migrate existing data from old schema to new schema
-- Migration: 20240101000009_migrate_existing_data.sql
-- This migration transforms data from the demo schema to the production schema

-- =====================================================
-- MIGRATION STRATEGY
-- =====================================================
-- Old Schema:
--   - experiences (single event with date)
--   - invitations (experience → school link)
--   - students (linked to invitation)
--   - guardians (linked to student)
--   - permission_slips (linked to invitation and student)
--   - payments (linked to permission slip)
--
-- New Schema:
--   - venues (new concept)
--   - experiences (now reusable templates)
--   - trips (specific instance of an experience)
--   - teachers (replaces invitation.teacher)
--   - rosters (new concept for grouping students)
--   - students (now linked to roster)
--   - parents (replaces guardians)
--   - permission_slips (now linked to trip)
--   - payments (now linked to permission slip with Stripe fields)

-- =====================================================
-- STEP 1: CREATE DEFAULT VENUE FOR MIGRATED DATA
-- =====================================================

-- Create a default venue for all existing experiences
INSERT INTO venues (id, name, description, contact_email, contact_phone, address, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Legacy Venue',
  'Default venue for migrated experiences from demo application',
  'legacy@tripslip.com',
  '+1-555-0100',
  '{}',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: MIGRATE EXPERIENCES TO NEW SCHEMA
-- =====================================================

-- Transform old experiences into new reusable experience templates
-- Note: Old experiences had specific dates; new experiences are templates
INSERT INTO experiences (
  id,
  venue_id,
  title,
  description,
  duration_minutes,
  min_students,
  max_students,
  published,
  created_at,
  updated_at
)
SELECT 
  e.id,
  '00000000-0000-0000-0000-000000000001'::uuid as venue_id,
  e.title,
  e.description,
  240 as duration_minutes, -- Default 4 hours
  1 as min_students,
  100 as max_students, -- Default capacity
  true as published,
  e.created_at,
  e.created_at as updated_at
FROM experiences e
WHERE NOT EXISTS (
  SELECT 1 FROM experiences ne WHERE ne.id = e.id
)
ON CONFLICT (id) DO NOTHING;

-- Create pricing tiers for migrated experiences
INSERT INTO pricing_tiers (
  experience_id,
  min_students,
  max_students,
  price_per_student_cents,
  created_at,
  updated_at
)
SELECT 
  e.id,
  1 as min_students,
  999 as max_students,
  e.cost_cents,
  e.created_at,
  e.created_at as updated_at
FROM experiences e
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_tiers pt WHERE pt.experience_id = e.id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: MIGRATE INVITATIONS TO TEACHERS AND TRIPS
-- =====================================================

-- Create teachers from invitations
INSERT INTO teachers (
  id,
  user_id,
  email,
  first_name,
  last_name,
  school_id,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  NULL as user_id, -- No auth user yet
  i.teacher_email,
  split_part(i.teacher, ' ', 1) as first_name,
  COALESCE(split_part(i.teacher, ' ', 2), '') as last_name,
  NULL as school_id, -- Will be linked later if schools are created
  i.created_at,
  i.created_at as updated_at
FROM invitations i
WHERE NOT EXISTS (
  SELECT 1 FROM teachers t WHERE t.email = i.teacher_email
)
ON CONFLICT (email) DO NOTHING;

-- Create trips from invitations
-- Each invitation becomes a trip instance
INSERT INTO trips (
  id,
  experience_id,
  teacher_id,
  trip_date,
  trip_time,
  student_count,
  status,
  direct_link_token,
  created_at,
  updated_at
)
SELECT 
  i.id as id, -- Reuse invitation ID as trip ID
  i.experience_id,
  (SELECT id FROM teachers WHERE email = i.teacher_email LIMIT 1) as teacher_id,
  (SELECT event_date FROM experiences WHERE id = i.experience_id) as trip_date,
  (SELECT event_time FROM experiences WHERE id = i.experience_id) as trip_time,
  (SELECT COUNT(*) FROM students WHERE invitation_id = i.id) as student_count,
  CASE 
    WHEN i.status = 'COMPLETED' THEN 'completed'
    WHEN i.status = 'ACTIVE' THEN 'confirmed'
    ELSE 'pending'
  END as status,
  gen_random_uuid()::text as direct_link_token,
  i.created_at,
  i.created_at as updated_at
FROM invitations i
WHERE NOT EXISTS (
  SELECT 1 FROM trips t WHERE t.id = i.id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: MIGRATE STUDENTS TO ROSTERS
-- =====================================================

-- Create default rosters for each teacher
INSERT INTO rosters (
  id,
  teacher_id,
  name,
  school_year,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  t.id as teacher_id,
  'Migrated Roster' as name,
  EXTRACT(YEAR FROM NOW())::text || '-' || (EXTRACT(YEAR FROM NOW()) + 1)::text as school_year,
  t.created_at,
  t.created_at as updated_at
FROM teachers t
WHERE NOT EXISTS (
  SELECT 1 FROM rosters r WHERE r.teacher_id = t.id
)
ON CONFLICT DO NOTHING;

-- Migrate students to new schema
-- Link students to rosters based on their invitation's teacher
INSERT INTO students (
  id,
  roster_id,
  first_name,
  last_name,
  grade,
  medical_info,
  created_at,
  updated_at
)
SELECT 
  s.id,
  (
    SELECT r.id FROM rosters r
    JOIN teachers t ON r.teacher_id = t.id
    JOIN invitations i ON i.teacher_email = t.email
    WHERE i.id = s.invitation_id
    LIMIT 1
  ) as roster_id,
  s.first_name,
  s.last_name,
  s.grade,
  '{}' as medical_info, -- Empty JSONB for now
  s.created_at,
  s.created_at as updated_at
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM students ns WHERE ns.id = s.id AND ns.roster_id IS NOT NULL
)
ON CONFLICT (id) DO UPDATE SET
  roster_id = EXCLUDED.roster_id,
  updated_at = EXCLUDED.updated_at;

-- =====================================================
-- STEP 5: MIGRATE GUARDIANS TO PARENTS
-- =====================================================

-- Create parents from guardians
INSERT INTO parents (
  id,
  user_id,
  email,
  first_name,
  last_name,
  phone,
  language,
  created_at,
  updated_at
)
SELECT 
  g.id,
  NULL as user_id, -- No auth user yet
  g.email,
  split_part(g.full_name, ' ', 1) as first_name,
  COALESCE(split_part(g.full_name, ' ', 2), '') as last_name,
  g.phone,
  g.language,
  g.created_at,
  g.created_at as updated_at
FROM guardians g
WHERE NOT EXISTS (
  SELECT 1 FROM parents p WHERE p.id = g.id
)
ON CONFLICT (id) DO NOTHING;

-- Create student-parent relationships
INSERT INTO student_parents (
  student_id,
  parent_id,
  relationship,
  is_primary,
  created_at
)
SELECT 
  g.student_id,
  g.id as parent_id,
  'parent' as relationship,
  true as is_primary,
  g.created_at
FROM guardians g
WHERE NOT EXISTS (
  SELECT 1 FROM student_parents sp 
  WHERE sp.student_id = g.student_id AND sp.parent_id = g.id
)
ON CONFLICT (student_id, parent_id) DO NOTHING;

-- =====================================================
-- STEP 6: MIGRATE PERMISSION SLIPS
-- =====================================================

-- Migrate permission slips to new schema
-- Link to trips instead of invitations
INSERT INTO permission_slips (
  id,
  trip_id,
  student_id,
  magic_link_token,
  token_expires_at,
  status,
  form_data,
  signature_data,
  signed_at,
  signed_by_parent_id,
  created_at,
  updated_at
)
SELECT 
  ps.id,
  ps.invitation_id as trip_id, -- Invitation ID = Trip ID from step 3
  ps.student_id,
  ps.token as magic_link_token,
  NOW() + INTERVAL '7 days' as token_expires_at,
  CASE 
    WHEN ps.status = 'COMPLETED' THEN 'signed'
    WHEN ps.status = 'OPENED' THEN 'pending'
    WHEN ps.status = 'SENT' THEN 'pending'
    ELSE 'pending'
  END as status,
  ps.form_data,
  ps.signature_data,
  ps.signed_at,
  (SELECT id FROM parents WHERE id IN (
    SELECT parent_id FROM student_parents WHERE student_id = ps.student_id LIMIT 1
  )) as signed_by_parent_id,
  ps.created_at,
  ps.created_at as updated_at
FROM permission_slips ps
WHERE NOT EXISTS (
  SELECT 1 FROM permission_slips nps WHERE nps.id = ps.id AND nps.trip_id IS NOT NULL
)
ON CONFLICT (id) DO UPDATE SET
  trip_id = EXCLUDED.trip_id,
  magic_link_token = EXCLUDED.magic_link_token,
  token_expires_at = EXCLUDED.token_expires_at,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- =====================================================
-- STEP 7: MIGRATE PAYMENTS
-- =====================================================

-- Migrate payments to new schema with Stripe fields
INSERT INTO payments (
  id,
  permission_slip_id,
  parent_id,
  amount_cents,
  stripe_payment_intent_id,
  stripe_charge_id,
  stripe_fee_cents,
  status,
  payment_method,
  is_split_payment,
  paid_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  p.slip_id as permission_slip_id,
  (SELECT parent_id FROM student_parents WHERE student_id = (
    SELECT student_id FROM permission_slips WHERE id = p.slip_id
  ) LIMIT 1) as parent_id,
  p.amount_cents,
  NULL as stripe_payment_intent_id, -- No Stripe data in old schema
  NULL as stripe_charge_id,
  NULL as stripe_fee_cents,
  CASE 
    WHEN p.success = true THEN 'succeeded'
    ELSE 'failed'
  END as status,
  p.payment_method,
  false as is_split_payment,
  CASE WHEN p.success = true THEN p.created_at ELSE NULL END as paid_at,
  p.created_at,
  p.created_at as updated_at
FROM payments p
WHERE NOT EXISTS (
  SELECT 1 FROM payments np WHERE np.id = p.id AND np.permission_slip_id IS NOT NULL
)
ON CONFLICT (id) DO UPDATE SET
  permission_slip_id = EXCLUDED.permission_slip_id,
  parent_id = EXCLUDED.parent_id,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- =====================================================
-- STEP 8: UPDATE PERMISSION SLIP STATUS BASED ON PAYMENTS
-- =====================================================

-- Update permission slip status to 'paid' if payment succeeded
UPDATE permission_slips
SET status = 'paid', updated_at = NOW()
WHERE id IN (
  SELECT permission_slip_id 
  FROM payments 
  WHERE status = 'succeeded'
)
AND status = 'signed';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary of migration:
-- 1. Created default venue for legacy data
-- 2. Migrated experiences to reusable templates with pricing tiers
-- 3. Created teachers from invitations
-- 4. Created trips from invitations (specific instances)
-- 5. Created rosters for teachers
-- 6. Migrated students to rosters
-- 7. Migrated guardians to parents with relationships
-- 8. Migrated permission slips to new trip-based structure
-- 9. Migrated payments with new Stripe-ready fields
-- 10. Updated permission slip statuses based on payment success

-- Note: This migration is idempotent and can be run multiple times safely
-- using ON CONFLICT clauses and NOT EXISTS checks.
