# TripSlip Authentication Guide

## Overview

TripSlip uses a comprehensive role-based access control (RBAC) system built on Supabase Auth. The authentication system supports multiple user roles, multi-tenancy, and flexible role switching for users with multiple organizational affiliations.

## Table of Contents

- [User Roles](#user-roles)
- [Signup Flows](#signup-flows)
- [Login Flow](#login-flow)
- [Password Reset Flow](#password-reset-flow)
- [Email Verification](#email-verification)
- [Role Switching](#role-switching)
- [Session Management](#session-management)
- [Protected Routes](#protected-routes)

## User Roles

TripSlip supports six distinct user roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| **Teacher** | Creates trips and manages students | School-level (own trips and students) |
| **School Admin** | Manages school operations | School-level (all school data) |
| **District Admin** | Oversees multiple schools | District-level (all schools in district) |
| **TripSlip Admin** | Platform administrator | Platform-wide (all data) |
| **Venue Admin** | Manages venue experiences | Venue-level (own venue data) |
| **Parent** | Views and signs permission slips | Student-level (own children only) |

### Role Hierarchy

```
TripSlip Admin (Platform-wide)
    ↓
District Admin (All schools in district)
    ↓
School Admin (Single school)
    ↓
Teacher (Own trips and students)
```

## Signup Flows

Each role has a dedicated signup page with role-specific organization selection.

### Teacher Signup

**Location**: `apps/teacher/src/pages/SignupPage.tsx`

**Flow**:
1. User navigates to teacher signup page
2. User enters email and password
3. User selects their school from dropdown
4. System creates user account with `teacher` role
5. System sends email verification link
6. User is redirected to email verification notice

**Required Fields**:
- Email address (validated format)
- Password (minimum 8 characters)
- School selection (from existing schools)

**Example**:
```typescript
// Teacher signup
await authService.signUp({
  email: 'teacher@school.edu',
  password: 'securepass123',
  role: 'teacher',
  organization_type: 'school',
  organization_id: 'school-uuid',
  metadata: {
    first_name: 'Jane',
    last_name: 'Smith'
  }
});
```

### School Admin Signup

**Location**: `apps/school/src/pages/SignupPage.tsx`

**Flow**:
1. User navigates to school admin signup page
2. User enters email and password
3. User selects role type (School Admin or District Admin)
4. User selects organization (school or district)
5. System creates user account with selected role
6. System sends email verification link
7. User is redirected to email verification notice

**Required Fields**:
- Email address
- Password (minimum 8 characters)
- Role selection (school_admin or district_admin)
- Organization selection (school or district)

**Example**:
```typescript
// School admin signup
await authService.signUp({
  email: 'admin@school.edu',
  password: 'securepass123',
  role: 'school_admin',
  organization_type: 'school',
  organization_id: 'school-uuid'
});

// District admin signup
await authService.signUp({
  email: 'admin@district.edu',
  password: 'securepass123',
  role: 'district_admin',
  organization_type: 'district',
  organization_id: 'district-uuid'
});
```

### Venue Admin Signup

**Location**: `apps/venue/src/pages/SignupPage.tsx`

**Flow**:
1. User navigates to venue signup page
2. User enters email and password
3. User selects their venue from dropdown
4. System creates user account with `venue_admin` role
5. System sends email verification link
6. User is redirected to email verification notice

**Required Fields**:
- Email address
- Password (minimum 8 characters)
- Venue selection (from existing venues)

**Example**:
```typescript
// Venue admin signup
await authService.signUp({
  email: 'admin@venue.com',
  password: 'securepass123',
  role: 'venue_admin',
  organization_type: 'venue',
  organization_id: 'venue-uuid'
});
```

### Organization Not Listed

If a user's organization is not in the dropdown, they can:
1. Click "Don't see your organization?" link
2. Submit a request form with organization details
3. Wait for TripSlip admin to add the organization
4. Return to signup once organization is added

## Login Flow

**Location**: `packages/auth/src/components/LoginPage.tsx`

All users use the same login page, regardless of role. The system automatically determines the user's role(s) after authentication.

### Standard Login Flow

1. User enters email and password
2. System validates credentials with Supabase Auth
3. System loads user's role assignments
4. System sets active role context (most recent or first role)
5. System redirects to role-appropriate dashboard

### Role-Based Redirects

After successful login, users are redirected based on their active role:

| Role | Redirect Destination |
|------|---------------------|
| Teacher | `/dashboard` (Teacher App) |
| School Admin | `/dashboard` (School App) |
| District Admin | `/district-admin` (School App) |
| TripSlip Admin | `/tripslip-admin` (School App) |
| Venue Admin | `/dashboard` (Venue App) |
| Parent | `/dashboard` (Parent App) |

### Deep Link Preservation

If a user attempts to access a protected route while unauthenticated:
1. System stores the requested URL
2. System redirects to login page
3. After successful login, system redirects to originally requested URL

**Example**:
```typescript
// User tries to access /trips/123
// Gets redirected to /login
// After login, redirected back to /trips/123
```

### Login Error Handling

| Error | Message | Action |
|-------|---------|--------|
| Invalid credentials | "Invalid email or password" | Re-enter credentials |
| Email not verified | "Please verify your email address" | Resend verification email |
| Account locked | "Account temporarily locked" | Contact support |
| Network error | "Connection error. Please try again" | Retry login |

## Password Reset Flow

Users can reset their password if they forget it.

### Request Password Reset

**Location**: `apps/*/src/pages/PasswordResetRequestPage.tsx`

1. User clicks "Forgot password?" on login page
2. User enters email address
3. System sends password reset email
4. User receives email with reset link (valid for 1 hour)

**Example**:
```typescript
await authService.resetPassword('user@example.com');
// Email sent with reset link
```

### Complete Password Reset

**Location**: `apps/*/src/pages/ResetPasswordPage.tsx`

1. User clicks reset link in email
2. System validates reset token
3. User enters new password
4. System updates password and invalidates token
5. User is redirected to login page

**Password Requirements**:
- Minimum 8 characters
- Same requirements as signup

**Token Expiration**:
- Reset tokens expire after 1 hour
- Expired tokens require requesting a new reset email
- Tokens are single-use (invalidated after successful reset)

## Email Verification

All new users must verify their email address.

### Verification Flow

**Location**: `apps/teacher/src/pages/EmailVerificationPage.tsx`

1. User receives verification email after signup
2. User clicks verification link (valid for 24 hours)
3. System validates token and marks email as verified
4. User is redirected to login page

### Verification Reminder

**Component**: `packages/auth/src/components/EmailVerificationReminderBanner.tsx`

If a user logs in with an unverified email:
1. Banner displays at top of all pages
2. User can click "Resend verification email"
3. System enforces 60-second cooldown between resends
4. User can continue using the app with limited access

### Resend Verification Email

```typescript
await authService.resendVerificationEmail();
// New verification email sent
```

## Role Switching

Users with multiple role assignments can switch between roles without re-authenticating.

### Multi-Role Scenarios

Common multi-role scenarios:
- Teacher who is also a School Admin
- School Admin who oversees multiple schools
- District Admin who is also a TripSlip Admin
- Venue Admin who is also a Teacher

### Role Switcher Component

**Location**: `packages/auth/src/components/RoleSwitcher.tsx`

The role switcher appears in the navigation menu when a user has multiple roles.

**Features**:
- Dropdown showing all role assignments
- Current active role highlighted
- Organization name displayed for each role
- Instant role switching without page reload

**Example**:
```typescript
// User has two roles
const roleAssignments = [
  {
    id: 'assignment-1',
    role_name: 'teacher',
    organization_type: 'school',
    organization_id: 'school-1',
    organization_name: 'Lincoln High School'
  },
  {
    id: 'assignment-2',
    role_name: 'school_admin',
    organization_type: 'school',
    organization_id: 'school-2',
    organization_name: 'Washington Middle School'
  }
];

// Switch to school admin role
await authService.switchRole('assignment-2');
// Active role updated, data access filters updated
```

### Role Switching Flow

1. User clicks role switcher dropdown
2. User selects different role
3. System updates active role context
4. System updates JWT claims with new role
5. System redirects to appropriate dashboard
6. All subsequent data queries use new role filters

### Active Role Persistence

The system remembers the user's active role:
- Active role stored in `active_role_context` table
- Persists across sessions
- User returns to same role on next login

## Session Management

### Session Duration

- Sessions last 7 days by default
- Sessions can be refreshed automatically
- Sessions are invalidated on logout

### Session Refresh

The auth context automatically refreshes sessions:
```typescript
// Automatic refresh every 5 minutes
useEffect(() => {
  const interval = setInterval(async () => {
    await authService.refreshSession();
  }, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### Logout

**Flow**:
1. User clicks logout button
2. System invalidates session with Supabase
3. System clears client-side tokens
4. System redirects to login page

**Example**:
```typescript
await authService.signOut();
// Session invalidated, tokens cleared
```

### Session Expiration Handling

When a session expires:
1. System detects expired session on next API call
2. System stores current URL
3. System redirects to login page
4. After re-authentication, system redirects to stored URL

## Protected Routes

All sensitive routes require authentication and optionally specific roles.

### ProtectedRoute Component

**Location**: `packages/auth/src/guards.tsx`

Wraps routes that require authentication:

```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

**Features**:
- Checks authentication status
- Redirects to login if unauthenticated
- Stores originally requested URL
- Shows loading state during auth check

### RoleGuard Component

**Location**: `packages/auth/src/guards.tsx`

Wraps routes that require specific roles:

```typescript
<RoleGuard requiredRoles={['school_admin', 'district_admin', 'tripslip_admin']}>
  <SchoolAdminDashboard />
</RoleGuard>
```

**Features**:
- Checks user has required role
- Shows access denied message if unauthorized
- Supports multiple allowed roles

### EmailVerificationGuard Component

**Location**: `packages/auth/src/guards.tsx`

Wraps routes that require verified email:

```typescript
<EmailVerificationGuard>
  <SensitiveFeaturePage />
</EmailVerificationGuard>
```

### Route Protection Examples

**Teacher App**:
```typescript
// All routes except login/signup protected
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/" element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } />
</Routes>
```

**School App**:
```typescript
// Protected + role-restricted
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/" element={
    <ProtectedRoute>
      <RoleGuard requiredRoles={['school_admin', 'district_admin', 'tripslip_admin']}>
        <SchoolDashboard />
      </RoleGuard>
    </ProtectedRoute>
  } />
</Routes>
```

## Using the Auth Context

### Setup

Wrap your app with AuthProvider:

```typescript
import { AuthProvider } from '@tripslip/auth';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### Accessing Auth State

```typescript
import { useAuth } from '@tripslip/auth';

function MyComponent() {
  const {
    user,              // Current user object
    session,           // Current session
    loading,           // Auth loading state
    activeRole,        // Current active role context
    roleAssignments,   // All user's role assignments
    isAuthenticated,   // Boolean: is user logged in?
    isEmailVerified,   // Boolean: is email verified?
    signIn,            // Function to sign in
    signUp,            // Function to sign up
    signOut,           // Function to sign out
    switchRole,        // Function to switch roles
    hasRole,           // Function to check if user has role
  } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.email}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Authorization Checks

```typescript
// Check if user has specific role
if (hasRole('school_admin')) {
  // Show admin features
}

// Check active role
if (activeRole?.role_name === 'teacher') {
  // Show teacher-specific UI
}

// Check multiple roles
const isAdmin = hasRole('school_admin') || 
                hasRole('district_admin') || 
                hasRole('tripslip_admin');
```

## Security Best Practices

### Password Requirements

- Minimum 8 characters
- Validated on both client and server
- Same requirements for signup and reset

### Email Validation

- Standard email format validation
- Verified using regex pattern
- Checked before account creation

### Token Security

- Verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Tokens are single-use and invalidated after use
- Tokens stored securely in database

### Session Security

- Sessions expire after 7 days
- Automatic session refresh
- Secure token storage
- HTTPS-only in production

### Error Messages

- Generic error messages for login failures
- Don't reveal whether email exists
- Don't reveal whether email or password was wrong
- Prevents user enumeration attacks

## Troubleshooting

### Common Issues

**"Invalid email or password"**
- Check email spelling
- Check password is correct
- Ensure account exists

**"Please verify your email address"**
- Check email inbox (and spam folder)
- Click verification link
- Request new verification email if expired

**"Session expired"**
- Log in again
- Check internet connection
- Clear browser cache if persistent

**"Access denied"**
- Verify you have the required role
- Contact administrator to request access
- Check you're using the correct app for your role

**Role switcher not appearing**
- Verify you have multiple role assignments
- Refresh the page
- Log out and log back in

### Support

For authentication issues:
1. Check this documentation
2. Verify environment variables are set correctly
3. Check Supabase dashboard for user status
4. Review audit logs for admin actions
5. Contact TripSlip support

## Related Documentation

- [RLS Policies and Security Model](./RLS_SECURITY_MODEL.md)
- [Database Setup](./DATABASE_README.md)
- [API Reference](../packages/auth/README.md)
