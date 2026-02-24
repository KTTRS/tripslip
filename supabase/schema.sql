-- TripSlip — complete Supabase schema
-- 6 tables, functions, triggers, indexes

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
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 2. Invitations ──────────────────────────────────────────
create table if not exists invitations (
  id              uuid primary key default gen_random_uuid(),
  experience_id   uuid not null references experiences(id) on delete cascade,
  school          text not null,
  teacher         text not null,
  teacher_email   text not null,
  status          text not null default 'PENDING'
                  check (status in ('PENDING','SENT','ACTIVE','COMPLETED')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 3. Students ─────────────────────────────────────────────
create table if not exists students (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references invitations(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  grade           text not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 4. Guardians ────────────────────────────────────────────
create table if not exists guardians (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  full_name       text not null,
  phone           text not null,
  email           text,
  language        text default 'en',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 5. Permission Slips ─────────────────────────────────────
create table if not exists permission_slips (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references invitations(id) on delete cascade,
  student_id      uuid not null references students(id) on delete cascade,
  token           text not null unique,
  status          text not null default 'PENDING'
                  check (status in ('PENDING','SENT','OPENED','COMPLETED')),
  form_data       jsonb,
  signature_data  text,
  signed_at       timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 6. Payments ─────────────────────────────────────────────
create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  slip_id         uuid not null references permission_slips(id) on delete cascade,
  payment_type    text not null check (payment_type in ('REQ','DON')),
  payment_method  text,
  amount_cents    integer not null check (amount_cents >= 0),
  success         boolean not null default false,
  created_at      timestamptz default now()
);

-- ── Add columns if migrating from older schema ──────────────
alter table experiences add column if not exists indemnification text;
alter table experiences add column if not exists updated_at timestamptz default now();
alter table invitations add column if not exists updated_at timestamptz default now();
alter table students add column if not exists updated_at timestamptz default now();
alter table guardians add column if not exists updated_at timestamptz default now();
alter table permission_slips add column if not exists updated_at timestamptz default now();

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at on any row change
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Generate a unique short token for permission slip share links
create or replace function generate_slip_token()
returns trigger as $$
begin
  if new.token is null or new.token = '' then
    new.token = encode(gen_random_bytes(12), 'hex');
  end if;
  return new;
end;
$$ language plpgsql;

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- updated_at triggers (one per table that has updated_at)
drop trigger if exists trg_experiences_updated_at on experiences;
create trigger trg_experiences_updated_at
  before update on experiences
  for each row execute function set_updated_at();

drop trigger if exists trg_invitations_updated_at on invitations;
create trigger trg_invitations_updated_at
  before update on invitations
  for each row execute function set_updated_at();

drop trigger if exists trg_students_updated_at on students;
create trigger trg_students_updated_at
  before update on students
  for each row execute function set_updated_at();

drop trigger if exists trg_guardians_updated_at on guardians;
create trigger trg_guardians_updated_at
  before update on guardians
  for each row execute function set_updated_at();

drop trigger if exists trg_slips_updated_at on permission_slips;
create trigger trg_slips_updated_at
  before update on permission_slips
  for each row execute function set_updated_at();

-- Auto-generate token when inserting a permission slip without one
drop trigger if exists trg_slips_token on permission_slips;
create trigger trg_slips_token
  before insert on permission_slips
  for each row execute function generate_slip_token();

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

create index if not exists idx_invitations_experience  on invitations(experience_id);
create index if not exists idx_students_invitation     on students(invitation_id);
create index if not exists idx_guardians_student       on guardians(student_id);
create index if not exists idx_slips_invitation        on permission_slips(invitation_id);
create index if not exists idx_slips_student           on permission_slips(student_id);
create index if not exists idx_slips_token             on permission_slips(token);
create index if not exists idx_slips_status            on permission_slips(status);
create index if not exists idx_payments_slip           on payments(slip_id);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (permissive for now — tighten with auth)
-- ═══════════════════════════════════════════════════════════

alter table experiences      enable row level security;
alter table invitations      enable row level security;
alter table students         enable row level security;
alter table guardians        enable row level security;
alter table permission_slips enable row level security;
alter table payments         enable row level security;

-- Drop-and-recreate so this file is fully idempotent
do $$ begin
  drop policy if exists "Allow all on experiences"      on experiences;
  drop policy if exists "Allow all on invitations"      on invitations;
  drop policy if exists "Allow all on students"         on students;
  drop policy if exists "Allow all on guardians"        on guardians;
  drop policy if exists "Allow all on permission_slips" on permission_slips;
  drop policy if exists "Allow all on payments"         on payments;
end $$;

create policy "Allow all on experiences"      on experiences      for all using (true) with check (true);
create policy "Allow all on invitations"      on invitations      for all using (true) with check (true);
create policy "Allow all on students"         on students         for all using (true) with check (true);
create policy "Allow all on guardians"        on guardians        for all using (true) with check (true);
create policy "Allow all on permission_slips" on permission_slips for all using (true) with check (true);
create policy "Allow all on payments"         on payments         for all using (true) with check (true);
