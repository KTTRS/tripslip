-- Disable RLS on approval workflow tables for testing
-- WARNING: This is for development/testing only. Re-enable RLS before production!

ALTER TABLE approval_chains DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_chain_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_approval_routing DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations DISABLE ROW LEVEL SECURITY;
