# Venue Employee Management System

This document describes the venue employee management system, which provides role-based access control for venue staff members.

## Overview

The venue employee management system allows venue administrators to invite employees with different access levels (administrator, editor, viewer) and manage their permissions. The system tracks invitation workflow and provides utilities for permission checking.

**Requirements:** 6.1, 6.2, 6.4, 6.5

## Database Schema

### Extended `venue_users` Table

The `venue_users` table has been extended with the following columns:

- `invited_by` (UUID, nullable): References the administrator who invited the employee
- `invited_at` (TIMESTAMPTZ): Timestamp when invitation was sent
- `accepted_at` (TIMESTAMPTZ, nullable): Timestamp when employee accepted invitation
- `deactivated_at` (TIMESTAMPTZ, nullable): Timestamp when employee account was deactivated

### Role Types

Three role types are supported:

1. **Administrator**: Full access to all venue features including employee management and financial data
2. **Editor**: Can modify venue information, experiences, and bookings but cannot delete or access financials
3. **Viewer**: Read-only access to venue data and bookings

### Indexes

- `idx_venue_users_active`: Optimizes queries for active employees
- `idx_venue_users_pending_invitations`: Optimizes queries for pending invitations

## Service API

### VenueEmployeeService

The `VenueEmployeeService` class provides methods for managing venue employees.

#### Creating the Service

```typescript
import { createSupabaseClient } from '@tripslip/database';
import { createVenueEmployeeService } from '@tripslip/database';

const supabase = createSupabaseClient();
const employeeService = createVenueEmployeeService(supabase);
```

#### Inviting an Employee

```typescript
const employee = await employeeService.inviteEmployee({
  venue_id: 'venue-123',
  user_id: 'user-456',
  role: 'editor',
  invited_by: 'admin-789',
});

// Returns: VenueEmployee with invited_at set, accepted_at null
```

#### Accepting an Invitation

```typescript
const employee = await employeeService.acceptInvitation('employee-id');

// Returns: VenueEmployee with accepted_at set
```

#### Updating Employee Role

```typescript
const employee = await employeeService.updateEmployeeRole({
  employee_id: 'employee-id',
  role: 'administrator',
});

// Returns: VenueEmployee with updated role
```

#### Deactivating an Employee

```typescript
const employee = await employeeService.deactivateEmployee('employee-id');

// Returns: VenueEmployee with deactivated_at set
```

#### Reactivating an Employee

```typescript
const employee = await employeeService.reactivateEmployee('employee-id');

// Returns: VenueEmployee with deactivated_at cleared
```

#### Getting Venue Employees

```typescript
// Get active employees only
const activeEmployees = await employeeService.getVenueEmployees('venue-id');

// Get all employees including deactivated
const allEmployees = await employeeService.getVenueEmployees('venue-id', true);
```

#### Getting Pending Invitations

```typescript
const pendingInvitations = await employeeService.getPendingInvitations('venue-id');

// Returns: Array of VenueEmployee with accepted_at null
```

#### Checking Permissions

```typescript
// Check if user has specific permission
const canDelete = await employeeService.hasPermission(
  'user-id',
  'venue-id',
  'venue.delete'
);

// Get all permissions for user
const permissions = await employeeService.getUserPermissions('user-id', 'venue-id');

// Check if user is administrator
const isAdmin = await employeeService.isAdministrator('user-id', 'venue-id');

// Get user's role
const role = await employeeService.getUserRole('user-id', 'venue-id');
```

## Permission System

### Permission Constants

```typescript
import { VENUE_PERMISSIONS } from '@tripslip/database';

// Available permissions:
VENUE_PERMISSIONS.VENUE_READ          // 'venue.read'
VENUE_PERMISSIONS.VENUE_WRITE         // 'venue.write'
VENUE_PERMISSIONS.VENUE_DELETE        // 'venue.delete'
VENUE_PERMISSIONS.EXPERIENCE_READ     // 'experience.read'
VENUE_PERMISSIONS.EXPERIENCE_WRITE    // 'experience.write'
VENUE_PERMISSIONS.EXPERIENCE_DELETE   // 'experience.delete'
VENUE_PERMISSIONS.BOOKING_READ        // 'booking.read'
VENUE_PERMISSIONS.BOOKING_WRITE       // 'booking.write'
VENUE_PERMISSIONS.EMPLOYEE_READ       // 'employee.read'
VENUE_PERMISSIONS.EMPLOYEE_WRITE      // 'employee.write'
VENUE_PERMISSIONS.EMPLOYEE_DELETE     // 'employee.delete'
VENUE_PERMISSIONS.ANALYTICS_READ      // 'analytics.read'
VENUE_PERMISSIONS.FINANCIAL_READ      // 'financial.read'
```

### Role Permissions Mapping

```typescript
import { ROLE_PERMISSIONS } from '@tripslip/database';

// Administrator permissions
ROLE_PERMISSIONS.administrator = [
  'venue.read', 'venue.write', 'venue.delete',
  'experience.read', 'experience.write', 'experience.delete',
  'booking.read', 'booking.write',
  'employee.read', 'employee.write', 'employee.delete',
  'analytics.read', 'financial.read'
];

// Editor permissions
ROLE_PERMISSIONS.editor = [
  'venue.read', 'venue.write',
  'experience.read', 'experience.write',
  'booking.read', 'booking.write',
  'analytics.read'
];

// Viewer permissions
ROLE_PERMISSIONS.viewer = [
  'venue.read', 'experience.read', 'booking.read', 'analytics.read'
];
```

### Permission Utility Functions

```typescript
import {
  roleHasPermission,
  canPerformAction,
  canManageEmployees,
  canAccessFinancials,
  canDeleteVenue,
  canModifyVenue,
  canViewVenue,
  getMinimumRoleForPermission,
  compareRoles,
  hasAtLeastRole,
} from '@tripslip/database';

// Check if role has permission
const hasPermission = roleHasPermission('editor', 'venue.write'); // true

// Check if role can perform action
const canWrite = canPerformAction('editor', 'venue', 'write'); // true

// Specific permission checks
const canManage = canManageEmployees('editor'); // false (admin only)
const canViewFinancials = canAccessFinancials('editor'); // false (admin only)
const canDelete = canDeleteVenue('editor'); // false (admin only)
const canModify = canModifyVenue('editor'); // true
const canView = canViewVenue('viewer'); // true

// Get minimum role for permission
const minRole = getMinimumRoleForPermission('venue.write'); // 'editor'

// Compare roles
const comparison = compareRoles('administrator', 'editor'); // 1 (admin > editor)

// Check if role has at least required privileges
const hasRequired = hasAtLeastRole('administrator', 'editor'); // true
```

### SQL Helper Functions for RLS Policies

```typescript
import {
  generatePermissionCheckSQL,
  generateAdminCheckSQL,
  generateActiveEmployeeCheckSQL,
} from '@tripslip/database';

// Generate SQL for permission check
const sql = generatePermissionCheckSQL('auth.uid()', 'venues.id', 'venue.write');
// Returns SQL that checks if user has venue.write permission

// Generate SQL for admin check
const adminSql = generateAdminCheckSQL('auth.uid()', 'venues.id');
// Returns SQL that checks if user is administrator

// Generate SQL for active employee check
const activeSql = generateActiveEmployeeCheckSQL('auth.uid()', 'venues.id');
// Returns SQL that checks if user is active employee
```

## Usage Examples

### Example 1: Inviting a New Employee

```typescript
import { createSupabaseClient, createVenueEmployeeService } from '@tripslip/database';

const supabase = createSupabaseClient();
const employeeService = createVenueEmployeeService(supabase);

async function inviteNewEmployee() {
  try {
    const employee = await employeeService.inviteEmployee({
      venue_id: 'venue-123',
      user_id: 'user-456',
      role: 'editor',
      invited_by: 'admin-789',
    });

    console.log('Employee invited:', employee);
    // TODO: Send invitation email to user
  } catch (error) {
    console.error('Failed to invite employee:', error);
  }
}
```

### Example 2: Checking Permissions Before Action

```typescript
import { createSupabaseClient, createVenueEmployeeService } from '@tripslip/database';

const supabase = createSupabaseClient();
const employeeService = createVenueEmployeeService(supabase);

async function deleteVenue(userId: string, venueId: string) {
  // Check if user has permission to delete venue
  const canDelete = await employeeService.hasPermission(
    userId,
    venueId,
    'venue.delete'
  );

  if (!canDelete) {
    throw new Error('You do not have permission to delete this venue');
  }

  // Proceed with deletion
  await supabase.from('venues').delete().eq('id', venueId);
}
```

### Example 3: Managing Employee Roles

```typescript
import { createSupabaseClient, createVenueEmployeeService } from '@tripslip/database';

const supabase = createSupabaseClient();
const employeeService = createVenueEmployeeService(supabase);

async function promoteToAdministrator(employeeId: string) {
  try {
    const employee = await employeeService.updateEmployeeRole({
      employee_id: employeeId,
      role: 'administrator',
    });

    console.log('Employee promoted to administrator:', employee);
  } catch (error) {
    console.error('Failed to promote employee:', error);
  }
}

async function deactivateEmployee(employeeId: string) {
  try {
    const employee = await employeeService.deactivateEmployee(employeeId);
    console.log('Employee deactivated:', employee);
  } catch (error) {
    console.error('Failed to deactivate employee:', error);
  }
}
```

### Example 4: Using Permission Utilities in UI

```typescript
import { canModifyVenue, canDeleteVenue, canManageEmployees } from '@tripslip/database';

function VenueActionsMenu({ userRole }: { userRole: VenueRole }) {
  return (
    <div>
      {canModifyVenue(userRole) && (
        <button>Edit Venue</button>
      )}
      {canDeleteVenue(userRole) && (
        <button>Delete Venue</button>
      )}
      {canManageEmployees(userRole) && (
        <button>Manage Employees</button>
      )}
    </div>
  );
}
```

## Row Level Security (RLS) Policies

The permission system can be integrated with Supabase RLS policies to enforce access control at the database level.

### Example RLS Policy for Venues Table

```sql
-- Allow venue employees to read their venue
CREATE POLICY "Venue employees can read their venue"
ON venues FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM venue_users
    WHERE venue_users.venue_id = venues.id
      AND venue_users.user_id = auth.uid()
      AND venue_users.role IN ('administrator', 'editor', 'viewer')
      AND venue_users.deactivated_at IS NULL
  )
);

-- Allow administrators and editors to update their venue
CREATE POLICY "Administrators and editors can update their venue"
ON venues FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM venue_users
    WHERE venue_users.venue_id = venues.id
      AND venue_users.user_id = auth.uid()
      AND venue_users.role IN ('administrator', 'editor')
      AND venue_users.deactivated_at IS NULL
  )
);

-- Allow only administrators to delete their venue
CREATE POLICY "Only administrators can delete their venue"
ON venues FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM venue_users
    WHERE venue_users.venue_id = venues.id
      AND venue_users.user_id = auth.uid()
      AND venue_users.role = 'administrator'
      AND venue_users.deactivated_at IS NULL
  )
);
```

## Testing

The employee management system includes comprehensive unit tests:

- `venue-employee-service.test.ts`: Tests for the VenueEmployeeService class (34 tests)
- `venue-permissions.test.ts`: Tests for permission utility functions (34 tests)

Run tests with:

```bash
cd packages/database
npm test
```

## Migration

The database migration is located at:
- `supabase/migrations/20240101000024_extend_venue_users_for_employees.sql`

Validation documentation:
- `supabase/migrations/_archive/supabase/migrations/_archive/validate_20240101000024.md`

## Related Files

- Service: `packages/database/src/venue-employee-service.ts`
- Permissions: `packages/database/src/venue-permissions.ts`
- Tests: `packages/database/src/__tests__/venue-employee-service.test.ts`
- Tests: `packages/database/src/__tests__/venue-permissions.test.ts`
- Migration: `supabase/migrations/20240101000024_extend_venue_users_for_employees.sql`
- Validation: `supabase/migrations/_archive/supabase/migrations/_archive/validate_20240101000024.md`

## Next Steps

1. Apply the migration to the database
2. Implement invitation email sending (integrate with notification service)
3. Create UI components for employee management
4. Add RLS policies for venue-related tables
5. Implement audit logging for employee actions
