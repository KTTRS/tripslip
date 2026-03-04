# Production Database Setup

## Supabase Project Creation

1. Create new Supabase project
2. Choose region closest to users
3. Set strong database password
4. Note project URL and keys

## Running Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Verifying RLS Policies

```sql
-- Check all RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Test policy for permission_slips
SELECT * FROM permission_slips WHERE parent_id = 'test-user-id';
```

## Configuring Backups

1. Go to Supabase Dashboard → Database → Backups
2. Enable daily backups
3. Set retention to 30 days
4. Test restore process

## Connection Pooling

```typescript
// Use connection pooler for production
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
    },
  }
);
```

## Performance Optimization

### Indexes
```sql
-- Add indexes for common queries
CREATE INDEX idx_trips_teacher_id ON trips(teacher_id);
CREATE INDEX idx_permission_slips_parent_id ON permission_slips(parent_id);
CREATE INDEX idx_payments_slip_id ON payments(slip_id);
```

### Query Optimization
- Use `.select()` to specify needed columns
- Use `.limit()` for pagination
- Use `.order()` for sorting
- Avoid N+1 queries with joins

## Monitoring

- Enable Supabase Dashboard monitoring
- Set up alerts for slow queries
- Monitor connection pool usage
- Track database size growth
