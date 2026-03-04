# TripSlip Row-Level Security (RLS) and Security Model

## Overview

TripSlip implements database-level security using PostgreSQL Row-Level Security (RLS) policies. This ensures data isolation is enforced at the database layer, protecting against application-level bugs and providing defense-in-depth security.

## Table of Contents

- [Security Architecture](#security-architecture)
- [Organization Hierarchy](#organization-hierarchy)
- [RLS Helper Functions](#rls-helper-functions)
- [Role-Based Data Access Rules](#role-based-data-access-rules)
- [RLS Policies by Table](#rls-policies-by-table)
- [Adding New Roles](#adding-new-roles)
- [Modifying Policies](#modifying-policies)
- [Testing RLS Policies](#testing-rls-policies)
- [Security Best Practices](#security-best-practices)

## Security Architecture

### Defense-in-Depth Layers

TripSlip implements multiple security layers:

1. **Application Layer**: Authentication guards, role checks in UI
2. **API Layer**: Authorization checks in API routes
3. **Database Layer**: RLS policies (primary enforcement)
4. **Network Layer**: HTTPS, secure tokens

### Why Database-Level Security?

RLS policies provide critical security advantages:

- **Bulletproof**: Enforced even if application code has bugs
- **Consistent**: Same rules apply to all database access methods
- **Auditable**: Policies are version-controlled and reviewable
- **Performance**: Policies use database indexes efficiently
- **Zero Trust**: Never trust application layer alone

### JWT Claims Architecture

User role and organization context is stored in JWT claims:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "school_admin",
  "app_metadata": {
    "active_role_assignment_id": "assignment-uuid",
    "organization_type": "school",
    "organization_id": "school-uuid"
  }
}
```

RLS policies extract these claims to make authorization decisions.

## Organization Hierarchy

TripSlip uses a hierarchical organization model:

```
Platform (TripSlip)
    ↓
Districts
    ↓
Schools
    ↓
Teachers
    ↓
Students
```

### Organization Types

| Type | Description | Example |
|------|-------------|---------|
| **platform** | TripSlip platform itself | TripSlip Inc. |
| **district** | School district | Springfield School District |
| **school** | Individual school | Lincoln High School |
| **venue** | Experience venue | Science Museum |

### District → School Relationship

Schools can belong to districts:

- **Standalone schools**: `district_id` is NULL
- **District schools**: `district_id` references a district

This is managed in the `school_districts` junction table:

```sql
CREATE TABLE school_districts (
  school_id UUID REFERENCES schools(id),
  district_id UUID REFERENCES districts(id),
  PRIMARY KEY (school_id, district_id)
);
```

## RLS Helper Functions

TripSlip provides SQL functions to extract role and organization context from JWT claims.

### auth.user_role()

Returns the user's active role name.

**Returns**: `TEXT` - Role name or 'anonymous'

**Usage**:
```sql
SELECT auth.user_role();
-- Returns: 'teacher', 'school_admin', 'district_admin', 'tripslip_admin', 'venue_admin', 'parent', or 'anonymous'
```

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'anonymous'
  );
$ LANGUAGE SQL STABLE;
```

### auth.user_organization_id()

Returns the user's active organization ID.

**Returns**: `UUID` - Organization ID or NULL

**Usage**:
```sql
SELECT auth.user_organization_id();
-- Returns: UUID of school, district, or venue
```

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'organization_id')::uuid,
    NULL
  );
$ LANGUAGE SQL STABLE;
```

### auth.user_organization_type()

Returns the user's active organization type.

**Returns**: `TEXT` - Organization type or NULL

**Usage**:
```sql
SELECT auth.user_organization_type();
-- Returns: 'school', 'district', 'venue', or 'platform'
```

### auth.has_role(required_role TEXT)

Checks if user has a specific role.

**Parameters**: `required_role` - Role name to check

**Returns**: `BOOLEAN`

**Usage**:
```sql
SELECT auth.has_role('school_admin');
-- Returns: true or false
```

### auth.is_tripslip_admin()

Checks if user is a TripSlip platform administrator.

**Returns**: `BOOLEAN`

**Usage**:
```sql
SELECT auth.is_tripslip_admin();
-- Returns: true or false
```

## Role-Based Data Access Rules

### Access Matrix

| Role | Trips | Students | Schools | Teachers | Experiences | Venues |
|------|-------|----------|---------|----------|-------------|--------|
| **Teacher** | Own trips | Own roster | Own school | Self + colleagues | Published | All claimed |
| **School Admin** | School trips | School students | Own school | School teachers | Published | All claimed |
| **District Admin** | District trips | District students | District schools | District teachers | Published | All claimed |
| **TripSlip Admin** | All | All | All | All | All | All |
| **Venue Admin** | None | None | None | None | Own venue | Own venue |
| **Parent** | None | Own children | None | None | Published | All claimed |

### Detailed Access Rules

#### Teacher Access

- **Trips**: Only trips they created
- **Students**: Only students in their rosters
- **Schools**: Their assigned school (read-only)
- **Teachers**: Themselves and colleagues in same school
- **Experiences**: All published experiences
- **Rosters**: Their own rosters

#### School Admin Access

- **Trips**: All trips from teachers in their school
- **Students**: All students from their school
- **Schools**: Their assigned school (read/write)
- **Teachers**: All teachers in their school (read/write)
- **Experiences**: All published experiences
- **Rosters**: All rosters from their school

#### District Admin Access

- **Trips**: All trips from schools in their district
- **Students**: All students from schools in their district
- **Schools**: All schools in their district (read/write)
- **Teachers**: All teachers from schools in their district
- **Experiences**: All published experiences
- **Rosters**: All rosters from their district

#### TripSlip Admin Access

- **Everything**: Unrestricted read/write access to all data
- **Audit**: All actions are logged in audit_logs table

#### Venue Admin Access

- **Experiences**: Only their venue's experiences (read/write)
- **Bookings**: Only bookings for their venue's experiences
- **Venues**: Their assigned venue (read/write)
- **Published Experiences**: Can view all published experiences

#### Parent Access

- **Students**: Only their own children
- **Permission Slips**: Only slips for their children
- **Trips**: Only trips their children are on (via permission slips)

## RLS Policies by Table

### Trips Table

**Enabled**: Yes

**Policies**:

#### SELECT Policy
```sql
CREATE POLICY "trips_select_policy" ON trips
FOR SELECT USING (
  CASE auth.user_role()
    WHEN 'teacher' THEN 
      teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    WHEN 'school_admin' THEN 
      teacher_id IN (SELECT id FROM teachers WHERE school_id = auth.user_organization_id())
    WHEN 'district_admin' THEN 
      teacher_id IN (
        SELECT t.id FROM teachers t
        JOIN school_districts sd ON t.school_id = sd.school_id
        WHERE sd.district_id = auth.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN true
    ELSE false
  END
);
```

**Logic**:
- Teachers: Only trips where they are the teacher
- School Admins: Trips from teachers in their school
- District Admins: Trips from teachers in district schools
- TripSlip Admins: All trips
- Others: No access

#### INSERT Policy
```sql
CREATE POLICY "trips_insert_policy" ON trips
FOR INSERT WITH CHECK (
  auth.user_role() IN ('teacher', 'school_admin', 'district_admin', 'tripslip_admin')
  AND teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
);
```

**Logic**: Teachers and admins can create trips, but must be the assigned teacher

#### UPDATE Policy
Same as SELECT - can only update trips you can see

#### DELETE Policy
Only admins (school_admin, district_admin, tripslip_admin) can delete trips within their scope

### Students Table

**Enabled**: Yes

**Policies**:

#### SELECT Policy
```sql
CREATE POLICY "students_select_policy" ON students
FOR SELECT USING (
  CASE auth.user_role()
    WHEN 'teacher' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        WHERE t.user_id = auth.uid()
      )
    WHEN 'school_admin' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        WHERE t.school_id = auth.user_organization_id()
      )
    WHEN 'district_admin' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        JOIN school_districts sd ON t.school_id = sd.school_id
        WHERE sd.district_id = auth.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN true
    WHEN 'parent' THEN
      id IN (
        SELECT student_id FROM student_parents
        WHERE parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid())
      )
    ELSE false
  END
);
```

**Logic**:
- Teachers: Students in their rosters
- School Admins: Students from their school's rosters
- District Admins: Students from district schools' rosters
- Parents: Their own children
- TripSlip Admins: All students
- Others: No access

#### INSERT/UPDATE/DELETE Policies
Teachers and admins can manage students within their scope

### Schools Table

**Enabled**: Yes

**Policies**:

#### SELECT Policy
```sql
CREATE POLICY "schools_select_policy" ON schools
FOR SELECT USING (
  CASE auth.user_role()
    WHEN 'school_admin' THEN id = auth.user_organization_id()
    WHEN 'district_admin' THEN 
      id IN (
        SELECT school_id FROM school_districts 
        WHERE district_id = auth.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN true
    WHEN 'teacher' THEN
      id IN (SELECT school_id FROM teachers WHERE user_id = auth.uid())
    ELSE false
  END
);
```

**Logic**:
- School Admins: Only their school
- District Admins: Schools in their district
- Teachers: Their assigned school
- TripSlip Admins: All schools
- Others: No access

#### INSERT Policy
Only TripSlip admins can create schools

#### UPDATE Policy
School admins can update their school, district admins their district schools, TripSlip admins all

#### DELETE Policy
Only TripSlip admins can delete schools

### Experiences Table

**Enabled**: Yes

**Policies**:

#### SELECT Policy
```sql
CREATE POLICY "experiences_select_policy" ON experiences
FOR SELECT USING (
  published = true
  OR (auth.user_role() = 'venue_admin' AND venue_id = auth.user_organization_id())
  OR auth.is_tripslip_admin()
);
```

**Logic**:
- All authenticated users: Published experiences
- Venue Admins: Their venue's experiences (published or unpublished)
- TripSlip Admins: All experiences
- Others: Only published experiences

#### INSERT Policy
Only venue admins can create experiences for their venue

#### UPDATE/DELETE Policies
Venue admins can modify their venue's experiences, TripSlip admins can modify all

### Teachers Table

**Enabled**: Yes

**Policies**:

#### SELECT Policy
```sql
CREATE POLICY "teachers_select_policy" ON teachers
FOR SELECT USING (
  CASE auth.user_role()
    WHEN 'teacher' THEN 
      user_id = auth.uid() OR school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    WHEN 'school_admin' THEN school_id = auth.user_organization_id()
    WHEN 'district_admin' THEN 
      school_id IN (
        SELECT school_id FROM school_districts 
        WHERE district_id = auth.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN true
    ELSE false
  END
);
```

**Logic**:
- Teachers: Themselves and colleagues in same school
- School Admins: Teachers in their school
- District Admins: Teachers in district schools
- TripSlip Admins: All teachers
- Others: No access

#### INSERT Policy
School admins and district admins can add teachers to their schools

#### UPDATE Policy
Teachers can update themselves, admins can update teachers in their scope

#### DELETE Policy
Only admins can delete teachers within their scope

### Supporting Tables

#### Rosters
Follow teacher access rules - teachers see their rosters, admins see rosters in their scope

#### Permission Slips
Follow trip access rules + parents can see slips for their children

#### Venues
Venue admins see their venue, TripSlip admins see all, others see claimed venues

#### Districts
District admins see their district, TripSlip admins see all

#### User Role Assignments
Users see their own assignments, TripSlip admins see all

#### Active Role Context
Users see their own context, TripSlip admins see all

## Adding New Roles

To add a new role to the system:

### 1. Add Role to user_roles Table

```sql
INSERT INTO user_roles (name, description)
VALUES ('new_role', 'Description of new role');
```

### 2. Update RLS Helper Functions (if needed)

If the new role requires special handling, update helper functions:

```sql
CREATE OR REPLACE FUNCTION auth.is_new_role()
RETURNS BOOLEAN AS $
  SELECT auth.user_role() = 'new_role';
$ LANGUAGE SQL STABLE;
```

### 3. Update RLS Policies

Add the new role to relevant RLS policies:

```sql
-- Example: Allow new role to view trips
DROP POLICY IF EXISTS "trips_select_policy" ON trips;
CREATE POLICY "trips_select_policy" ON trips
FOR SELECT USING (
  CASE auth.user_role()
    -- ... existing cases ...
    WHEN 'new_role' THEN 
      -- Define access logic for new role
      true
    ELSE false
  END
);
```

### 4. Update TypeScript Types

Add the new role to the TypeScript type definition:

```typescript
// packages/auth/src/types.ts
export type UserRole = 
  | 'teacher' 
  | 'school_admin' 
  | 'district_admin' 
  | 'tripslip_admin' 
  | 'venue_admin' 
  | 'parent'
  | 'new_role'; // Add new role
```

### 5. Create Signup Flow

Create a signup page for the new role:

```typescript
// apps/*/src/pages/NewRoleSignupPage.tsx
await authService.signUp({
  email: 'user@example.com',
  password: 'password',
  role: 'new_role',
  organization_type: 'appropriate_type',
  organization_id: 'org-uuid'
});
```

### 6. Update Navigation

Add navigation menu items for the new role:

```typescript
// packages/auth/src/components/Navigation.tsx
if (hasRole('new_role')) {
  // Show new role menu items
}
```

### 7. Test Thoroughly

- Test signup flow
- Test login and role assignment
- Test data access with new role
- Test role switching if applicable
- Test RLS policies with new role

## Modifying Policies

To modify existing RLS policies:

### 1. Create Migration File

```bash
# Create new migration
supabase migration new modify_trips_rls_policy
```

### 2. Drop and Recreate Policy

```sql
-- supabase/migrations/YYYYMMDD_modify_trips_rls_policy.sql

-- Drop existing policy
DROP POLICY IF EXISTS "trips_select_policy" ON trips;

-- Create updated policy
CREATE POLICY "trips_select_policy" ON trips
FOR SELECT USING (
  -- Updated logic here
);
```

### 3. Test in Development

```bash
# Apply migration locally
supabase db reset

# Test with different roles
# Verify data access is correct
```

### 4. Document Changes

Update this documentation with the new policy logic

### 5. Deploy to Production

```bash
# Apply migration to production
supabase db push
```

## Testing RLS Policies

### Manual Testing

Test RLS policies by impersonating different roles:

```sql
-- Set JWT claims to impersonate a teacher
SET request.jwt.claims = '{
  "sub": "user-uuid",
  "role": "teacher",
  "app_metadata": {
    "organization_type": "school",
    "organization_id": "school-uuid"
  }
}';

-- Query trips - should only see teacher's trips
SELECT * FROM trips;

-- Reset claims
RESET request.jwt.claims;
```

### Automated Testing

Create test cases for each role and table:

```typescript
// Test teacher can only see own trips
describe('Trips RLS Policy', () => {
  it('teacher sees only own trips', async () => {
    const { data } = await supabase
      .from('trips')
      .select('*');
    
    // Verify all trips belong to teacher
    expect(data.every(trip => trip.teacher_id === teacherId)).toBe(true);
  });
  
  it('teacher cannot see other teachers trips', async () => {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('teacher_id', otherTeacherId);
    
    // Should return empty array
    expect(data).toEqual([]);
  });
});
```

### Testing Checklist

For each role and table combination:

- [ ] Can read authorized data
- [ ] Cannot read unauthorized data
- [ ] Can insert where allowed
- [ ] Cannot insert where not allowed
- [ ] Can update authorized data
- [ ] Cannot update unauthorized data
- [ ] Can delete where allowed
- [ ] Cannot delete where not allowed

## Security Best Practices

### 1. Never Bypass RLS

Always use RLS policies. Never:
- Use service role key in client code
- Disable RLS on sensitive tables
- Create policies that return `true` for all users

### 2. Test All Policies

- Test positive cases (authorized access works)
- Test negative cases (unauthorized access blocked)
- Test edge cases (role switching, multi-role users)

### 3. Use Helper Functions

Use `auth.user_role()` and related functions instead of parsing JWT directly:

```sql
-- Good
WHERE auth.user_role() = 'teacher'

-- Bad
WHERE current_setting('request.jwt.claims')::json->>'role' = 'teacher'
```

### 4. Audit Admin Actions

Log all TripSlip admin actions:

```sql
-- Automatically log admin actions
CREATE TRIGGER audit_admin_actions
AFTER INSERT OR UPDATE OR DELETE ON sensitive_table
FOR EACH ROW
WHEN (auth.is_tripslip_admin())
EXECUTE FUNCTION log_admin_action();
```

### 5. Principle of Least Privilege

Grant minimum necessary access:
- Teachers see only their data
- School admins see only their school
- District admins see only their district

### 6. Defense in Depth

Implement security at multiple layers:
- RLS policies (primary)
- Application-level checks (secondary)
- UI guards (tertiary)

### 7. Regular Security Audits

- Review RLS policies quarterly
- Test with penetration testing
- Monitor audit logs for suspicious activity
- Update policies as requirements change

### 8. Document All Changes

- Document policy logic in comments
- Update this guide when policies change
- Maintain migration history
- Track security decisions

## Troubleshooting

### Policy Not Working

1. Check RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'your_table';`
2. Check policy exists: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
3. Check JWT claims are set correctly
4. Test with manual JWT claim setting

### Unexpected Access Denied

1. Verify user has correct role
2. Check organization_id matches
3. Verify role assignment is active
4. Check policy logic with manual testing

### Performance Issues

1. Add indexes on columns used in policies
2. Optimize subqueries in policies
3. Use materialized views for complex joins
4. Monitor query performance with EXPLAIN

## Related Documentation

- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Database Setup](./DATABASE_README.md)
- [API Reference](../packages/auth/README.md)
