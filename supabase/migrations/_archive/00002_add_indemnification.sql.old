-- Add indemnification text column to experiences
alter table experiences add column if not exists indemnification text;

-- Add write policies for experiences and invitations (admin operations)
create policy "insert_experiences" on experiences for insert with check (true);
create policy "update_experiences" on experiences for update using (true);
create policy "insert_invitations" on invitations for insert with check (true);
create policy "update_invitations" on invitations for update using (true);
create policy "insert_students" on students for insert with check (true);
create policy "insert_guardians" on guardians for insert with check (true);
create policy "insert_slips" on permission_slips for insert with check (true);
