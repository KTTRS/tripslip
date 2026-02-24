-- TripSlip initial schema
-- Matches the TypeScript types in src/lib/types.ts

-- Experiences (field trips / events)
create table experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  event_time text,
  location text,
  cost_cents integer not null default 0,
  payment_description text,
  donation_message text,
  created_at timestamptz not null default now()
);

-- Invitations (experience → school link)
create table invitations (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid references experiences(id) on delete cascade,
  school text not null,
  teacher text not null,
  teacher_email text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING','SENT','ACTIVE','COMPLETED')),
  created_at timestamptz not null default now()
);

-- Students
create table students (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  grade text not null,
  created_at timestamptz not null default now()
);

-- Guardians
create table guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  language text default 'en',
  created_at timestamptz not null default now()
);

-- Permission Slips
create table permission_slips (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  token text unique not null,
  status text not null default 'PENDING'
    check (status in ('PENDING','SENT','OPENED','COMPLETED')),
  form_data jsonb,
  signature_data text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  slip_id uuid references permission_slips(id) on delete cascade,
  payment_type text not null check (payment_type in ('REQ','DON')),
  payment_method text default 'card'
    check (payment_method in ('card','cashapp','venmo','zelle','chime','applepay','googlepay')),
  amount_cents integer not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_invitations_experience on invitations(experience_id);
create index idx_students_invitation on students(invitation_id);
create index idx_guardians_student on guardians(student_id);
create index idx_slips_invitation on permission_slips(invitation_id);
create index idx_slips_student on permission_slips(student_id);
create index idx_slips_token on permission_slips(token);
create index idx_payments_slip on payments(slip_id);

-- Row Level Security
alter table experiences enable row level security;
alter table invitations enable row level security;
alter table students enable row level security;
alter table guardians enable row level security;
alter table permission_slips enable row level security;
alter table payments enable row level security;

-- Public read policies (for demo / anon access)
create policy "read_experiences" on experiences for select using (true);
create policy "read_invitations" on invitations for select using (true);
create policy "read_students" on students for select using (true);
create policy "read_guardians" on guardians for select using (true);
create policy "read_slips" on permission_slips for select using (true);
create policy "read_payments" on payments for select using (true);

-- Write policies for parent flow
create policy "update_slips" on permission_slips for update using (true);
create policy "insert_payments" on payments for insert with check (true);
