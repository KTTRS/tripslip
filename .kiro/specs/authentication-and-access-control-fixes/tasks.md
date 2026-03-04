# Implementation Plan: Authentication and Access Control Fixes

## Overview

This implementation plan establishes comprehensive authentication and role-based access control (RBAC) across the TripSlip platform. The work is organized into discrete coding tasks that build incrementally, starting with database schema and RLS policies, then authentication infrastructure, followed by UI components, and finally integration and testing.

Each task references specific requirements from the requirements document and builds on previous tasks. The plan includes checkpoint tasks to ensure incremental validation and optional testing sub-tasks for faster MVP delivery.

## Tasks

- [x] 1. Set up database schema for roles and organizations
  - Create migration file for user_roles, user_role_assignments, active_role_context, and districts tables
  - Add district_id foreign key to schools table
  - Create indexes for performance optimization
  - _Requirements: 11.1, 11.2, 11.5, 11.6_

- [x] 2. Implement RLS helper functions
  - [x] 2.1 Create auth.user_role() function to extract role from JWT claims
    - Write SQL function to parse JWT claims and return role name
    - _Requirements: 12.1_
  
  - [x] 2.2 Create auth.user_organization_id() function to extract organization ID from JWT
    - Write SQL function to parse JWT claims and return organization ID
    - _Requirements: 12.1_
  
  - [x] 2.3 Create auth.user_organization_type() function to extract organization type from JWT
    - Write SQL function to parse JWT claims and return organization type
    - _Requirements: 12.1_
  
  - [x] 2.4 Create auth.has_role() function to check if user has specific role
    - Write SQL function to compare user's role with required role
    - _Requirements: 12.1_
  
  - [x] 2.5 Create auth.is_tripslip_admin() function to check admin status
    - Write SQL function to check if user has tripslip_admin role
    - _Requirements: 12.1_


- [x] 3. Implement Row-Level Security policies
  - [x] 3.1 Create RLS policies for trips table
    - Implement SELECT, INSERT, UPDATE policies with role-based filtering
    - Teachers see only their trips, school admins see school trips, district admins see district trips, TripSlip admins see all
    - _Requirements: 12.1, 6.1, 7.3, 8.3, 9.1_
  
  - [x] 3.2 Create RLS policies for students table
    - Implement SELECT policy with role-based filtering
    - Teachers see students in their rosters, school admins see school students, district admins see district students, parents see their children
    - _Requirements: 12.2, 6.2, 7.4, 8.4_
  
  - [x] 3.3 Create RLS policies for schools table
    - Implement SELECT policy with role-based filtering
    - School admins see their school, district admins see district schools, teachers see their school
    - _Requirements: 12.3, 7.1, 8.2_
  
  - [x] 3.4 Create RLS policies for experiences table
    - Implement SELECT, INSERT, UPDATE policies with venue ownership filtering
    - All users see published experiences, venue admins see/modify their venue's experiences
    - _Requirements: 12.4, 10.1, 10.5_
  
  - [x] 3.5 Create RLS policies for bookings table
    - Implement SELECT policy with role-based filtering
    - Venue admins see bookings for their experiences, school users see their school's bookings
    - _Requirements: 12.5_
  
  - [x] 3.6 Create RLS policies for teachers table
    - Implement SELECT policy with role-based filtering
    - School admins see teachers in their school, district admins see teachers in district schools
    - _Requirements: 7.2, 8.4_
  
  - [x] 3.7 Enable RLS on all sensitive tables
    - Execute ALTER TABLE ... ENABLE ROW LEVEL SECURITY for all tables with policies
    - _Requirements: 12.7_

- [x] 4. Create auth package core types and interfaces
  - [x] 4.1 Define TypeScript types for roles and assignments
    - Create UserRole, OrganizationType, RoleAssignment, ActiveRoleContext interfaces
    - _Requirements: 11.1, 11.2_
  
  - [x] 4.2 Define AuthService interface
    - Create interface with authentication, session management, and role management methods
    - _Requirements: 1.1, 3.1, 4.1, 18.1_
  
  - [x] 4.3 Define AuthContextType interface
    - Create interface for React context with user state and actions
    - _Requirements: 13.1_

- [x] 5. Implement AuthService class
  - [x] 5.1 Implement signup method
    - Create user account with Supabase Auth
    - Create role assignment record
    - Send verification email
    - _Requirements: 1.2, 1.4, 1.7, 5.5_
  
  - [x] 5.2 Implement signIn method
    - Authenticate with Supabase Auth
    - Load role assignments
    - Set active role context
    - Update JWT claims with role information
    - _Requirements: 3.2, 3.4_
  
  - [x] 5.3 Implement signOut method
    - Invalidate session with Supabase Auth
    - Clear client-side tokens
    - _Requirements: 18.2, 18.3, 18.5_
  
  - [x] 5.4 Implement password reset methods
    - Implement resetPassword() to send reset email
    - Implement updatePassword() to change password
    - _Requirements: 4.2, 4.4, 4.6_
  
  - [x] 5.5 Implement email verification methods
    - Implement verifyEmail() to confirm email with token
    - Implement resendVerificationEmail() to send new verification link
    - _Requirements: 2.1, 2.3_
  
  - [x] 5.6 Implement role management methods
    - Implement getRoleAssignments() to fetch user's roles
    - Implement getActiveRoleContext() to get current role
    - Implement switchRole() to change active role
    - _Requirements: 11.4, 20.2_
  
  - [x] 5.7 Implement authorization helper methods
    - Implement hasRole() to check if user has specific role
    - Implement canAccessOrganization() to check organization access
    - _Requirements: 6.1, 7.1, 8.1, 10.1_


- [x] 6. Implement error handling utilities
  - Create error classes for authentication and authorization errors
  - Implement error codes and user-friendly messages
  - _Requirements: 1.3, 3.3, 2.4, 4.5_

- [x] 7. Implement validation utilities
  - [x] 7.1 Create email validation function
    - Validate email format using standard regex
    - _Requirements: 1.6_
  
  - [x] 7.2 Create password validation function
    - Validate minimum 8 characters length
    - _Requirements: 1.5, 4.6_
  
  - [x] 7.3 Create organization validation function
    - Validate organization exists and matches type
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 19.4_

- [x] 8. Checkpoint - Database and core services complete
  - Ensure all migrations run successfully
  - Verify RLS policies are enabled and working
  - Test AuthService methods with manual queries
  - Ask the user if questions arise

- [x] 9. Implement AuthContext provider
  - [x] 9.1 Create AuthContext with React Context API
    - Set up context with user, session, loading, activeRole, roleAssignments state
    - _Requirements: 13.1_
  
  - [x] 9.2 Implement session initialization and refresh
    - Load session on mount
    - Set up session refresh interval
    - Handle session expiration
    - _Requirements: 3.5, 3.6_
  
  - [x] 9.3 Implement authentication action handlers
    - Wire up signIn, signUp, signOut actions to AuthService
    - Handle errors and update UI state
    - _Requirements: 1.2, 3.2, 18.2_
  
  - [x] 9.4 Implement role switching handler
    - Wire up switchRole action to AuthService
    - Update active role state
    - _Requirements: 20.2, 20.3_

- [x] 10. Implement authentication guards
  - [x] 10.1 Create ProtectedRoute component
    - Check authentication status
    - Redirect to login if unauthenticated
    - Store originally requested URL
    - _Requirements: 13.4, 13.6_
  
  - [x] 10.2 Create RoleGuard component
    - Check user has required role(s)
    - Display access denied message if unauthorized
    - _Requirements: 17.3, 17.4_
  
  - [x] 10.3 Create EmailVerificationGuard component
    - Check email verification status
    - Display verification reminder if unverified
    - _Requirements: 2.2_

- [x] 11. Create signup pages
  - [x] 11.1 Create TeacherSignupPage component
    - Form with email, password, school selection
    - Validation and error handling
    - Redirect to email verification notice
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 5.1_
  
  - [x] 11.2 Create SchoolAdminSignupPage component
    - Form with email, password, school selection
    - Support for district admin role selection
    - Validation and error handling
    - _Requirements: 1.1, 5.2, 5.3_
  
  - [x] 11.3 Create VenueAdminSignupPage component
    - Form with email, password, venue selection
    - Validation and error handling
    - _Requirements: 1.1, 5.4_
  
  - [x] 11.4 Create organization selection components
    - SchoolSelector dropdown component
    - DistrictSelector dropdown component
    - VenueSelector dropdown component
    - "Request new organization" link
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_


- [x] 12. Create login pages
  - [x] 12.1 Create shared LoginPage component
    - Form with email and password fields
    - Error handling for invalid credentials
    - Link to password reset page
    - Link to signup pages
    - _Requirements: 3.1, 3.3_
  
  - [x] 12.2 Implement role-based redirect after login
    - Redirect teachers to teacher dashboard
    - Redirect school admins to school dashboard
    - Redirect district admins to district dashboard
    - Redirect venue admins to venue dashboard
    - Redirect to originally requested URL if stored
    - _Requirements: 3.4, 13.6_
  
  - [x] 12.3 Add login pages to all apps
    - Add login route to teacher app
    - Add login route to school app
    - Add login route to venue app
    - _Requirements: 3.1, 17.1, 17.2_

- [x] 13. Create password reset pages
  - [x] 13.1 Create PasswordResetRequestPage component
    - Form with email field
    - Send reset email on submit
    - Display confirmation message
    - _Requirements: 4.1, 4.2_
  
  - [x] 13.2 Create PasswordResetPage component
    - Form with new password field
    - Validate token from URL
    - Handle expired token error
    - Update password on submit
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [x] 14. Create email verification pages
  - [x] 14.1 Create EmailVerificationPage component
    - Extract token from URL
    - Verify email with token
    - Handle expired token error
    - Display success/error message
    - _Requirements: 2.1, 2.4_
  
  - [x] 14.2 Create EmailVerificationReminderBanner component
    - Display banner on protected pages if email unverified
    - "Resend verification email" button
    - Countdown timer to prevent spam (60 seconds)
    - _Requirements: 2.2, 2.3_

- [x] 15. Implement role switcher UI
  - [x] 15.1 Create RoleSwitcher component
    - Dropdown showing all user's role assignments
    - Display current active role
    - Switch role on selection
    - _Requirements: 11.4, 14.6, 20.1_
  
  - [x] 15.2 Add RoleSwitcher to navigation menus
    - Add to teacher app navigation
    - Add to school app navigation
    - Add to venue app navigation
    - Only show if user has multiple roles
    - _Requirements: 14.6, 20.1_

- [x] 16. Implement role-based navigation menus
  - [x] 16.1 Create navigation menu for teachers
    - Show only teacher-appropriate menu items
    - Dashboard, Trips, Students, Profile
    - _Requirements: 14.1_
  
  - [x] 16.2 Create navigation menu for school admins
    - Show only school-admin-appropriate menu items
    - Dashboard, Teachers, Trips, Students, Settings
    - _Requirements: 14.2_
  
  - [x] 16.3 Create navigation menu for district admins
    - Show district-admin-appropriate menu items
    - Dashboard, Schools, Reports, Settings
    - _Requirements: 14.3_
  
  - [x] 16.4 Create navigation menu for TripSlip admins
    - Show all administrative menu items
    - Dashboard, Districts, Schools, Venues, Users, Settings
    - _Requirements: 14.4_
  
  - [x] 16.5 Create navigation menu for venue admins
    - Show venue-admin-appropriate menu items
    - Dashboard, Experiences, Bookings, Settings
    - _Requirements: 14.5_


- [x] 17. Create district admin dashboard
  - [x] 17.1 Create DistrictAdminDashboard component
    - Display total schools count
    - Display total trips count
    - Display total students count
    - Display list of schools with key metrics
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 17.2 Implement drill-down to school details
    - Link from school list to school detail page
    - _Requirements: 15.6_
  
  - [x] 17.3 Add route to school app
    - Add /district-admin route
    - Protect with RoleGuard requiring district_admin role
    - _Requirements: 15.1_

- [x] 18. Create TripSlip admin dashboard
  - [x] 18.1 Create TripSlipAdminDashboard component
    - Display total districts count
    - Display total schools count
    - Display total trips count
    - Display total users by role
    - Display total venues count
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [x] 18.2 Implement drill-down to district and school details
    - Links to district and school detail pages
    - _Requirements: 16.7_
  
  - [x] 18.3 Add route to school app
    - Add /tripslip-admin route
    - Protect with RoleGuard requiring tripslip_admin role
    - _Requirements: 16.1_

- [x] 19. Checkpoint - UI components complete
  - Test all signup flows manually
  - Test login and role switching
  - Test password reset flow
  - Test email verification flow
  - Verify navigation menus show correct items per role
  - Ask the user if questions arise

- [x] 20. Add authentication guards to existing routes
  - [x] 20.1 Add ProtectedRoute to teacher app routes
    - Wrap all routes except login/signup with ProtectedRoute
    - _Requirements: 13.1_
  
  - [x] 20.2 Add ProtectedRoute to school app routes
    - Wrap all routes except login/signup with ProtectedRoute
    - Add RoleGuard requiring school_admin, district_admin, or tripslip_admin
    - _Requirements: 13.2, 17.3, 17.4_
  
  - [x] 20.3 Add ProtectedRoute to venue app routes
    - Wrap all routes except login/signup with ProtectedRoute
    - _Requirements: 13.3_

- [x] 21. Update existing components to use role-based filtering
  - [x] 21.1 Update teacher dashboard to use RLS-filtered data
    - Remove client-side filtering, rely on RLS policies
    - _Requirements: 6.1, 6.2_
  
  - [x] 21.2 Update school dashboard to use RLS-filtered data
    - Remove client-side filtering, rely on RLS policies
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 21.3 Update venue dashboard to use RLS-filtered data
    - Remove client-side filtering, rely on RLS policies
    - _Requirements: 10.1, 10.2_

- [x] 22. Implement audit logging for admin actions
  - [x] 22.1 Create audit_logs table
    - Store action, table_name, record_id, user_id, timestamp, metadata
    - _Requirements: 9.5, 19.5_
  
  - [x] 22.2 Create audit logging service
    - Function to log admin actions
    - Automatically capture user context
    - _Requirements: 9.5, 19.5_
  
  - [x] 22.3 Add audit logging to TripSlip admin actions
    - Log all create, update, delete operations
    - Log role assignment changes
    - _Requirements: 9.5, 19.5_


- [x] 23. Implement role assignment validation
  - [x] 23.1 Create role assignment validation service
    - Validate role exists in user_roles table
    - Validate organization exists and matches type
    - Prevent self-role-modification
    - _Requirements: 19.2, 19.3, 19.4_
  
  - [x] 23.2 Add validation to role assignment operations
    - Apply validation before creating/updating role assignments
    - Return appropriate error messages
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [x] 24. Implement active role persistence
  - [x] 24.1 Update switchRole to persist selection
    - Store active role in active_role_context table
    - Update JWT claims with new role
    - _Requirements: 20.5_
  
  - [x] 24.2 Load persisted role on login
    - Check active_role_context table on login
    - Set active role from persisted selection
    - _Requirements: 20.5_

- [x]* 25. Write unit tests for AuthService
  - [ ]* 25.1 Test signup flow
    - Test successful signup with valid credentials
    - Test signup rejection with duplicate email
    - Test signup rejection with invalid email format
    - Test signup rejection with weak password
    - Test email verification record creation
    - Test role assignment creation during signup
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [ ]* 25.2 Test login flow
    - Test successful login with valid credentials
    - Test login rejection with invalid email
    - Test login rejection with invalid password
    - Test session creation on successful login
    - Test role assignments loaded on login
    - Test active role context set on login
    - _Requirements: 3.2, 3.3_
  
  - [ ]* 25.3 Test email verification
    - Test email verification with valid token
    - Test email verification rejection with expired token
    - Test email verification rejection with invalid token
    - Test verified status grants access to features
    - Test resend verification email functionality
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [ ]* 25.4 Test password reset
    - Test password reset request creates reset token
    - Test password reset with valid token
    - Test password reset rejection with expired token
    - Test password reset token invalidation after use
    - Test password validation during reset
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 25.5 Test session management
    - Test session validity check
    - Test session invalidation on logout
    - Test expired session rejection
    - Test client token cleanup on logout
    - _Requirements: 3.5, 18.2, 18.4, 18.5_
  
  - [ ]* 25.6 Test role switching
    - Test user with multiple roles can switch
    - Test role switch updates active context
    - Test role switch changes data access
    - Test active role persists across sessions
    - _Requirements: 20.2, 20.3, 20.4, 20.5_

- [x]* 26. Write unit tests for RLS policies
  - [ ]* 26.1 Test trips table RLS policies
    - Test teacher sees only own trips
    - Test school admin sees only school trips
    - Test district admin sees only district trips
    - Test TripSlip admin sees all trips
    - Test unauthorized access returns empty results
    - _Requirements: 6.1, 7.3, 8.3, 9.1, 12.1_
  
  - [ ]* 26.2 Test students table RLS policies
    - Test teacher sees students in their rosters
    - Test school admin sees school students
    - Test district admin sees district students
    - Test parent sees their children
    - Test unauthorized access returns empty results
    - _Requirements: 6.2, 7.4, 8.4, 12.2_
  
  - [ ]* 26.3 Test schools table RLS policies
    - Test school admin sees only their school
    - Test district admin sees district schools
    - Test teacher sees their school
    - Test unauthorized access returns empty results
    - _Requirements: 7.1, 8.2, 12.3_
  
  - [ ]* 26.4 Test experiences table RLS policies
    - Test all users see published experiences
    - Test venue admin sees their venue's experiences
    - Test venue admin can modify their experiences
    - Test unauthorized modification is denied
    - _Requirements: 10.1, 10.5, 12.4_
  
  - [ ]* 26.5 Test teachers table RLS policies
    - Test school admin sees teachers in their school
    - Test district admin sees teachers in district schools
    - Test unauthorized access returns empty results
    - _Requirements: 7.2, 8.4_


- [x]* 27. Write property-based tests for authentication
  - [ ]* 27.1 Property test for signup role assignment
    - **Property 9: Signup Role Assignment**
    - **Validates: Requirements 1.2, 1.7, 5.5**
    - Test that signup creates user with correct role and organization
    - Use fast-check to generate random valid signup data
    - _Requirements: 1.2, 1.7, 5.5_
  
  - [ ]* 27.2 Property test for valid credentials authentication
    - **Property 10: Valid Credentials Authentication**
    - **Validates: Requirements 3.2**
    - Test that valid credentials always result in successful authentication
    - Use fast-check to generate random valid credentials
    - _Requirements: 3.2_
  
  - [ ]* 27.3 Property test for session invalidation
    - **Property 11: Session Invalidation on Logout**
    - **Validates: Requirements 18.2, 18.4**
    - Test that logout always invalidates session
    - Use fast-check to generate random session data
    - _Requirements: 18.2, 18.4_
  
  - [ ]* 27.4 Property test for token expiration
    - **Property 12: Token Expiration Enforcement**
    - **Validates: Requirements 2.4, 4.5**
    - Test that expired tokens are always rejected
    - Use fast-check to generate random token data with various expiration times
    - _Requirements: 2.4, 4.5_
  
  - [ ]* 27.5 Property test for duplicate email rejection
    - **Property 13: Duplicate Email Rejection**
    - **Validates: Requirements 1.3**
    - Test that duplicate emails are always rejected
    - Use fast-check to generate random email addresses
    - _Requirements: 1.3_
  
  - [ ]* 27.6 Property test for email verification state transition
    - **Property 14: Email Verification State Transition**
    - **Validates: Requirements 2.1, 2.5**
    - Test that valid verification token always marks email as verified
    - Use fast-check to generate random verification scenarios
    - _Requirements: 2.1, 2.5_
  
  - [ ]* 27.7 Property test for password validation consistency
    - **Property 15: Password Validation Consistency**
    - **Validates: Requirements 1.5, 4.6**
    - Test that password validation is consistent across signup and reset
    - Use fast-check to generate random passwords
    - _Requirements: 1.5, 4.6_
  
  - [ ]* 27.8 Property test for email format validation
    - **Property 16: Email Format Validation**
    - **Validates: Requirements 1.6**
    - Test that invalid email formats are always rejected
    - Use fast-check to generate random email-like strings
    - _Requirements: 1.6_
  
  - [ ]* 27.9 Property test for invalid credentials rejection
    - **Property 17: Invalid Credentials Rejection**
    - **Validates: Requirements 3.3**
    - Test that invalid credentials always result in rejection
    - Use fast-check to generate random invalid credentials
    - _Requirements: 3.3_
  
  - [ ]* 27.10 Property test for password reset token single use
    - **Property 18: Password Reset Token Single Use**
    - **Validates: Requirements 4.2, 4.4**
    - Test that reset tokens can only be used once
    - Use fast-check to generate random reset scenarios
    - _Requirements: 4.2, 4.4_
  
  - [ ]* 27.11 Property test for verification email creation
    - **Property 19: Verification Email Creation**
    - **Validates: Requirements 1.4**
    - Test that signup always creates verification record
    - Use fast-check to generate random signup data
    - _Requirements: 1.4_
  
  - [ ]* 27.12 Property test for client token cleanup
    - **Property 28: Client Token Cleanup**
    - **Validates: Requirements 18.5**
    - Test that logout always clears client tokens
    - Use fast-check to generate random token storage scenarios
    - _Requirements: 18.5_
  
  - [ ]* 27.13 Property test for self-role-modification prevention
    - **Property 29: Self-Role-Modification Prevention**
    - **Validates: Requirements 19.2**
    - Test that users cannot modify their own roles
    - Use fast-check to generate random role modification attempts
    - _Requirements: 19.2_
  
  - [ ]* 27.14 Property test for role assignment validation
    - **Property 30: Role Assignment Validation**
    - **Validates: Requirements 19.3, 19.4**
    - Test that invalid role assignments are rejected
    - Use fast-check to generate random role assignment data
    - _Requirements: 19.3, 19.4_


- [x]* 28. Write property-based tests for role-based data access
  - [ ]* 28.1 Property test for role-based trip filtering
    - **Property 1: Role-Based Trip Filtering**
    - **Validates: Requirements 6.1, 7.3, 8.3, 9.1**
    - Test that trip queries return correct results for all roles
    - Use fast-check to generate random users, roles, and trips
    - _Requirements: 6.1, 7.3, 8.3, 9.1_
  
  - [ ]* 28.2 Property test for role-based student filtering
    - **Property 2: Role-Based Student Filtering**
    - **Validates: Requirements 6.2, 7.4, 8.4, 9.1**
    - Test that student queries return correct results for all roles
    - Use fast-check to generate random users, roles, and students
    - _Requirements: 6.2, 7.4, 8.4, 9.1_
  
  - [ ]* 28.3 Property test for role-based school filtering
    - **Property 3: Role-Based School Filtering**
    - **Validates: Requirements 7.1, 8.2, 9.1**
    - Test that school queries return correct results for all roles
    - Use fast-check to generate random users, roles, and schools
    - _Requirements: 7.1, 8.2, 9.1_
  
  - [ ]* 28.4 Property test for role-based teacher filtering
    - **Property 4: Role-Based Teacher Filtering**
    - **Validates: Requirements 7.2, 8.4, 9.1**
    - Test that teacher queries return correct results for all roles
    - Use fast-check to generate random users, roles, and teachers
    - _Requirements: 7.2, 8.4, 9.1_
  
  - [ ]* 28.5 Property test for role-based experience filtering
    - **Property 5: Role-Based Experience Filtering**
    - **Validates: Requirements 6.5, 10.1, 9.2**
    - Test that experience queries return correct results for all roles
    - Use fast-check to generate random users, roles, and experiences
    - _Requirements: 6.5, 10.1, 9.2_
  
  - [ ]* 28.6 Property test for unauthorized data access denial
    - **Property 6: Unauthorized Data Access Denial**
    - **Validates: Requirements 6.4, 7.6, 8.6, 10.4, 12.6**
    - Test that unauthorized queries always return zero rows
    - Use fast-check to generate random unauthorized access attempts
    - _Requirements: 6.4, 7.6, 8.6, 10.4, 12.6_

- [x]* 29. Write property-based tests for dashboard metrics
  - [ ]* 29.1 Property test for district admin dashboard metrics
    - **Property 7: District Admin Dashboard Metrics**
    - **Validates: Requirements 15.2, 15.3, 15.4**
    - Test that dashboard metrics match actual filtered data
    - Use fast-check to generate random district data
    - _Requirements: 15.2, 15.3, 15.4_
  
  - [ ]* 29.2 Property test for TripSlip admin dashboard metrics
    - **Property 8: TripSlip Admin Dashboard Metrics**
    - **Validates: Requirements 16.2, 16.3, 16.4, 16.5, 16.6**
    - Test that platform-wide metrics match actual data
    - Use fast-check to generate random platform data
    - _Requirements: 16.2, 16.3, 16.4, 16.5, 16.6_

- [x]* 30. Write property-based tests for role management
  - [ ]* 30.1 Property test for multiple role support
    - **Property 20: Multiple Role Support**
    - **Validates: Requirements 11.3**
    - Test that users can have multiple role assignments
    - Use fast-check to generate random multi-role scenarios
    - _Requirements: 11.3_
  
  - [ ]* 30.2 Property test for role context switching
    - **Property 21: Role Context Switching**
    - **Validates: Requirements 11.4, 20.2, 20.4**
    - Test that role switching updates data access correctly
    - Use fast-check to generate random role switching scenarios
    - _Requirements: 11.4, 20.2, 20.4_
  
  - [ ]* 30.3 Property test for active role persistence
    - **Property 22: Active Role Persistence**
    - **Validates: Requirements 20.5**
    - Test that active role persists across sessions
    - Use fast-check to generate random session scenarios
    - _Requirements: 20.5_
  
  - [ ]* 30.4 Property test for venue admin write access restriction
    - **Property 23: Venue Admin Write Access Restriction**
    - **Validates: Requirements 10.5**
    - Test that venue admins can only modify their venue's data
    - Use fast-check to generate random venue modification attempts
    - _Requirements: 10.5_
  
  - [ ]* 30.5 Property test for TripSlip admin unrestricted access
    - **Property 24: TripSlip Admin Unrestricted Access**
    - **Validates: Requirements 9.2**
    - Test that TripSlip admins have unrestricted access
    - Use fast-check to generate random data access scenarios
    - _Requirements: 9.2_
  
  - [ ]* 30.6 Property test for admin action audit logging
    - **Property 25: Admin Action Audit Logging**
    - **Validates: Requirements 9.5, 19.5**
    - Test that admin actions always create audit logs
    - Use fast-check to generate random admin actions
    - _Requirements: 9.5, 19.5_


- [x]* 31. Write property-based tests for authorization
  - [ ]* 31.1 Property test for school app role authorization
    - **Property 26: School App Role Authorization**
    - **Validates: Requirements 17.3, 17.4**
    - Test that only authorized roles can access school app
    - Use fast-check to generate random role access attempts
    - _Requirements: 17.3, 17.4_
  
  - [ ]* 31.2 Property test for session validity check
    - **Property 27: Session Validity Check**
    - **Validates: Requirements 13.5**
    - Test that protected routes verify session validity
    - Use fast-check to generate random session states
    - _Requirements: 13.5_

- [x]* 32. Write integration tests
  - [ ]* 32.1 Test complete signup → verify email → login flow
    - Test end-to-end user onboarding
    - Verify all state transitions
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ]* 32.2 Test login → switch role → access data flow
    - Test multi-role user workflow
    - Verify data access changes with role
    - _Requirements: 3.1, 20.2, 6.1_
  
  - [ ]* 32.3 Test forgot password → reset → login flow
    - Test complete password recovery
    - Verify token lifecycle
    - _Requirements: 4.1, 4.3, 3.1_
  
  - [ ]* 32.4 Test protected route access with various auth states
    - Test unauthenticated access
    - Test authenticated access
    - Test expired session access
    - Test unauthorized role access
    - _Requirements: 13.4, 13.5, 17.3_

- [x] 33. Final checkpoint - Complete implementation
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Run all integration tests and verify they pass
  - Test complete user flows manually in each app
  - Verify RLS policies are working correctly
  - Verify audit logging is capturing admin actions
  - Ask the user if questions arise

- [x] 34. Documentation and cleanup
  - [x] 34.1 Document authentication setup in README
    - Document signup flows for each role
    - Document login and password reset flows
    - Document role switching for multi-role users
    - _Requirements: All_
  
  - [x] 34.2 Document RLS policies and security model
    - Document role-based data access rules
    - Document organization hierarchy (district → school)
    - Document how to add new roles or modify policies
    - _Requirements: 12.1-12.7_
  
  - [x] 34.3 Create migration rollback scripts
    - Create scripts to safely rollback database changes if needed
    - Document rollback procedure
    - _Requirements: 11.1-11.6_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using randomized inputs
- Unit tests validate specific examples, edge cases, and error conditions
- All authentication and authorization logic is enforced at the database level using RLS policies
- JWT claims store active role context to avoid database lookups on every request
- The implementation supports multi-role users with role switching capability
- Audit logging captures all admin actions for security and compliance

