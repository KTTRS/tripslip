-- TripSlip seed data — matches src/lib/store.ts demo data

-- Experience
insert into experiences (id, title, description, event_date, event_time, location, cost_cents, payment_description, donation_message)
values (
  '00000000-0000-0000-0000-000000000001',
  'Stock Market Challenge 2026',
  '6-week experiential program — student teams manage virtual portfolios competing across Detroit schools.',
  '2026-03-15',
  '9:00 AM – 2:30 PM',
  'Junior Achievement of Michigan, Detroit',
  1500,
  'Bus transportation fee',
  'Every dollar goes directly to the TripSlip Field Trip Fund — ensuring no student misses out because of cost.'
);

-- Invitations
insert into invitations (id, experience_id, school, teacher, teacher_email, status) values
  ('00000000-0000-0000-0001-000000000000', '00000000-0000-0000-0000-000000000001', 'Cass Tech', 'Ms. Rodriguez', 'rodriguez@cass.dpscd.org', 'ACTIVE'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'DPSCD Virtual', 'Mr. Thompson', 'thompson@virtual.dpscd.org', 'ACTIVE'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Southeastern', 'Mrs. Williams', 'williams@se.dpscd.org', 'ACTIVE'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Renaissance', 'Mr. Davis', 'davis@ren.dpscd.org', 'SENT'),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Henry Ford Academy', 'Ms. Chen', 'chen@hfa.edu', 'SENT'),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Marygrove / CMA', 'Mrs. Johnson', 'johnson@marygrove.edu', 'PENDING');

-- Students (Cass Tech)
insert into students (id, invitation_id, first_name, last_name, grade) values
  ('00000000-0000-0000-0002-000000000000', '00000000-0000-0000-0001-000000000000', 'Jaylen', 'Carter', '11'),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000000', 'Nia', 'Washington', '11'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000000', 'Marcus', 'Thompson', '11'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000000', 'Amara', 'Okafor', '11'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000000', 'DeShawn', 'Mitchell', '11'),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000000', 'Zoe', 'Kim', '11'),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000000', 'Isaiah', 'Brown', '11'),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0001-000000000000', 'Aaliyah', 'Jackson', '11'),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0001-000000000000', 'Tyler', 'Garcia', '11'),
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0001-000000000000', 'Destiny', 'Williams', '11');

-- Students (Southeastern)
insert into students (id, invitation_id, first_name, last_name, grade) values
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000002', 'Malik', 'Reed', '10'),
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000002', 'Jasmine', 'Cole', '10'),
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000002', 'Andre', 'Price', '10'),
  ('00000000-0000-0000-0002-000000000013', '00000000-0000-0000-0001-000000000002', 'Kayla', 'Foster', '10'),
  ('00000000-0000-0000-0002-000000000014', '00000000-0000-0000-0001-000000000002', 'Elijah', 'Grant', '10');

-- Guardians
insert into guardians (id, student_id, full_name, phone, email, language) values
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000000', 'Michelle Carter', '+13135551001', 'm.carter@gmail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000001', 'Derek Washington', '+13135551002', 'd.wash@yahoo.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000002', 'Lisa Thompson', '+13135551003', 'lisa.t@gmail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000003', 'Chidi Okafor', '+13135551004', 'c.okafor@outlook.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000004', 'Tamika Mitchell', '+13135551005', 'tamika.m@gmail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000005', 'James Kim', '+13135551006', 'j.kim@gmail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000006', 'Angela Brown', '+13135551007', 'a.brown@aol.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000007', 'Robert Jackson', '+13135551008', 'r.jackson@gmail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000008', 'Maria Garcia', '+13135551009', 'm.garcia@gmail.com', 'es'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000009', 'Kevin Williams', '+13135551010', 'k.will@gmail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000010', 'Sandra Reed', '+13135552000', 'sandra@mail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000011', 'Tony Cole', '+13135552001', 'tony@mail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000012', 'Diana Price', '+13135552002', 'diana@mail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000013', 'Marcus Foster', '+13135552003', 'marcus@mail.com', 'en'),
  (gen_random_uuid(), '00000000-0000-0000-0002-000000000014', 'Tina Grant', '+13135552004', 'tina@mail.com', 'en');
