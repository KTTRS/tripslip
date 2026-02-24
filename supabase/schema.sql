-- TripSlip — complete Supabase schema
-- 6 tables: experiences, invitations, students, guardians, permission_slips, payments

-- ── 1. Experiences ──────────────────────────────────────────
create table if not exists experiences (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  event_date      date not null,
  event_time      text,
  location        text,
  cost_cents      integer not null default 0,
  payment_description text,
  donation_message    text,
  indemnification     text,
  created_at      timestamptz default now()
);

-- ── 2. Invitations ──────────────────────────────────────────
create table if not exists invitations (
  id              uuid primary key default gen_random_uuid(),
  experience_id   uuid not null references experiences(id) on delete cascade,
  school          text not null,
  teacher         text not null,
  teacher_email   text not null,
  status          text not null default 'PENDING',
  created_at      timestamptz default now()
);

-- ── 3. Students ─────────────────────────────────────────────
create table if not exists students (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references invitations(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  grade           text not null,
  created_at      timestamptz default now()
);

-- ── 4. Guardians ────────────────────────────────────────────
create table if not exists guardians (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  full_name       text not null,
  phone           text not null,
  email           text,
  language        text default 'en',
  created_at      timestamptz default now()
);

-- ── 5. Permission Slips ─────────────────────────────────────
create table if not exists permission_slips (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references invitations(id) on delete cascade,
  student_id      uuid not null references students(id) on delete cascade,
  token           text not null unique,
  status          text not null default 'PENDING',
  form_data       jsonb,
  signature_data  text,
  signed_at       timestamptz,
  created_at      timestamptz default now()
);

-- ── 6. Payments ─────────────────────────────────────────────
create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  slip_id         uuid not null references permission_slips(id) on delete cascade,
  payment_type    text not null,
  payment_method  text,
  amount_cents    integer not null,
  success         boolean not null default false,
  created_at      timestamptz default now()
);

-- ── Add indemnification column if missing (safe to re-run) ──
alter table experiences add column if not exists indemnification text;

-- ── RLS: allow all for now (tighten later) ──────────────────
alter table experiences      enable row level security;
alter table invitations      enable row level security;
alter table students         enable row level security;
alter table guardians        enable row level security;
alter table permission_slips enable row level security;
alter table payments         enable row level security;

create policy if not exists "Allow all on experiences"      on experiences      for all using (true) with check (true);
create policy if not exists "Allow all on invitations"      on invitations      for all using (true) with check (true);
create policy if not exists "Allow all on students"         on students         for all using (true) with check (true);
create policy if not exists "Allow all on guardians"        on guardians        for all using (true) with check (true);
create policy if not exists "Allow all on permission_slips" on permission_slips for all using (true) with check (true);
create policy if not exists "Allow all on payments"         on payments         for all using (true) with check (true);
