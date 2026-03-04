# Requirements: Codebase Fixes - Critical Launch Issues

## Overview

Fix all 47 issues identified in the comprehensive codebase review to ensure the TripSlip platform is production-ready. Issues are categorized by severity: Critical (8), High Priority (15), Medium Priority (14), and Low Priority (10).

## Business Requirements

### BR-1: Production Readiness
**Priority:** Critical  
**Description:** All critical and high-priority issues must be resolved before production launch.

**Acceptance Criteria:**
- All TypeScript compilation errors fixed
- All broken features implemented
- All security vulnerabilities addressed
- All console.log statements removed from production code
- Environment variables properly validated

### BR-2: User Experience Completeness
**Priority:** High  
**Description:** All user-facing features must be fully implemented with no stub pages or TODO placeholders.

**Acceptance Criteria:**
- Permission slip page fully functional
- PDF receipt generation working
- Draft saving implemented
- All navigation handlers functional
- Email/SMS notifications operational

### BR-3: Security & Compliance
**Priority:** Critical  
**Description:** Platform must meet security best practices and FERPA compliance requirements.

**Acceptance Criteria:**
- Input validation and sanitization complete
- Error handling comprehensive
- Authentication context properly implemented
- Rate limiting functional
- Audit logging complete

### BR-4: Code Quality & Maintainability
**Priority:** Medium  
**Description:** Codebase must follow best practices and be maintainable.

**Acceptance Criteria:**
- No code duplication for common patterns
- Consistent error handling
- Proper TypeScript strict mode
- Internationalized error messages
- Proper loading and empty states

## Functional Requirements

### FR-1: Fix Critical Type Errors
**Priority:** Critical  
**Components:** SchoolTripList, TripCreationForm

**Requirements:**
1. Fix SchoolTripList import errors (supabase export)
2. Fix Trip type property names (name → title, total_cost → estimated_cost_cents)
3. Fix deprecated FormEvent usage
4. Ensure all components compile without errors

### FR-2: Implement Permission Slip Page
**Priority:** Critical  
**Component:** PermissionSlipPage

**Requirements:**
1. Fetch permission slip by magic link token from URL
2. Display trip details (venue, date, time, cost)
3. Display student information
4. Show form fields for parent information
5. Implement signature capture (canvas or typed signature)
6. Validate all required fields
7. Submit signed permission slip to database
8. Handle payment requirement if applicable
9. Show success/error states
10. Support multi-language (EN/ES/AR)

### FR-3: Environment Variable Validation
**Priority:** Critical  
**All Apps**

**Requirements:**
1. Create centralized env validation utility
2. Validate all required env vars at app startup
3. Provide clear error messages for missing vars
4. Fail fast with helpful debugging info
5. Document all required env vars in .env.example

### FR-4: Remove Console.log Statements
**Priority:** Critical  
**All Files**

**Requirements:**
1. Replace all console.log with proper logging service
2. Use monitoring service (Sentry) for errors
3. Use debug logging for development only
4. Remove sensitive data from logs
5. Implement structured logging

### FR-5: Fix Edge Function Imports
**Priority:** Critical  
**Component:** create-payment-intent Edge Function

**Requirements:**
1. Verify _shared/security.ts import path works in Deno
2. Test Edge Function deployment
3. Add error handling for import failures
4. Document Edge Function development setup

### FR-6: Implement Error Handling
**Priority:** Critical  
**All Async Operations**

**Requirements:**
1. Wrap all async operations in try-catch
2. Display user-friendly error messages
3. Log errors to monitoring service
4. Implement retry logic where appropriate
5. Handle network failures gracefully

### FR-7: Fix Stripe Webhook Handling
**Priority:** Critical  
**Component:** stripe-webhook Edge Function

**Requirements:**
1. Log unhandled event types to database
2. Create alerts for unknown events
3. Improve error handling for webhook failures
4. Add webhook event replay capability
5. Test all webhook event types

### FR-8: Implement Authentication Context
**Priority:** High  
**Component:** School App

**Requirements:**
1. Create SchoolAuthContext
2. Extract schoolId from authenticated user
3. Extract administratorId from session
4. Replace all hardcoded default values
5. Add proper error handling for unauthenticated users
6. Implement role-based access control

### FR-9: PDF Receipt Generation
**Priority:** High  
**Components:** PaymentSuccessPage, PaymentHistory

**Requirements:**
1. Install PDF generation library (jsPDF or pdfmake)
2. Create receipt template with TripSlip branding
3. Include payment details, trip info, student info
4. Generate PDF on demand
5. Store PDFs in Supabase Storage
6. Provide download link
7. Support multi-language receipts

### FR-10: Draft Saving Implementation
**Priority:** High  
**Component:** Trip Creation Store

**Requirements:**
1. Create trip_drafts table in database
2. Implement auto-save every 30 seconds
3. Save draft on navigation away
4. Load draft on return to trip creation
5. Show "Resume Draft" option on dashboard
6. Clear draft after successful submission
7. Handle multiple drafts per teacher

### FR-11: Stripe Connect Integration
**Priority:** High  
**Component:** Venue Payouts

**Requirements:**
1. Add stripe_account_id column to venues table
2. Implement Stripe Connect onboarding flow
3. Create payout dashboard for venues
4. Track payout history
5. Handle payout webhooks
6. Display payout status and schedule
7. Support multiple payout methods

### FR-12: Google Maps Integration
**Priority:** High  
**Component:** VenueMapView

**Requirements:**
1. Add VITE_GOOGLE_MAPS_API_KEY to env vars
2. Uncomment and test Google Maps code
3. Implement map initialization
4. Add venue markers
5. Implement click handlers for venue focus
6. Add fallback to static maps if API key missing
7. Consider alternative: Mapbox or OpenStreetMap

### FR-13: Email Notification Implementation
**Priority:** High  
**Component:** Trip Creation Review Step

**Requirements:**
1. Implement Edge Function call for email sending
2. Batch email sending for multiple parents
3. Add retry logic for failed sends
4. Track email delivery status in database
5. Show notification status to teacher
6. Handle email bounces and failures

### FR-14: Venue Employee Invitations
**Priority:** High  
**Component:** Venue Employee Service

**Requirements:**
1. Create invitation email template
2. Call send-email Edge Function
3. Generate magic link for account setup
4. Track invitation status
5. Implement invitation expiration
6. Allow resending invitations

### FR-15: Search Category Facets
**Priority:** High  
**Component:** Search Service

**Requirements:**
1. Implement venue category system
2. Add category facets to search results
3. Update search UI with category filters
4. Support multi-select category filtering
5. Show category counts in facets

### FR-16: Resend Verification Email
**Priority:** High  
**Component:** Auth Guards

**Requirements:**
1. Implement resend functionality using Supabase Auth
2. Add rate limiting (max 3 resends per hour)
3. Show success/error messages
4. Track resend attempts
5. Update UI to show resend button

### FR-17: Last Login Tracking
**Priority:** High  
**Component:** Teacher Management

**Requirements:**
1. Add last_login_at column to teachers table
2. Update on successful login
3. Display in teacher management UI
4. Show "Never logged in" for new teachers
5. Use for activity monitoring

### FR-18: Venue Navigation
**Priority:** High  
**Components:** SearchResults, VenueMapView

**Requirements:**
1. Implement navigation using React Router
2. Create venue detail page route
3. Pass venue ID as URL parameter
4. Handle navigation from search results
5. Handle navigation from map markers

### FR-19: School Association in Trips
**Priority:** High  
**Component:** Trip Creation

**Requirements:**
1. Fetch teacher profile with school relationship
2. Include school_id in trip creation
3. Validate school exists before submission
4. Display school name in trip details
5. Filter trips by school in school app

### FR-20: Database Tables for Logging
**Priority:** High  
**Components:** Edge Functions

**Requirements:**
1. Create rate_limits table migration
2. Create sms_logs table migration
3. Create email_logs table migration
4. Create webhook_events table migration
5. Add proper indexes for querying
6. Implement cleanup jobs for old logs

### FR-21: Centralize Supabase Client
**Priority:** Medium  
**All Apps**

**Requirements:**
1. Create lib/supabase.ts in each app
2. Export singleton Supabase client
3. Replace all inline client creation
4. Update imports across all files
5. Improve testability with centralized client

### FR-22: Test Coverage Improvements
**Priority:** Medium  
**CI/CD Pipeline**

**Requirements:**
1. Create check-coverage.js script
2. Update CI workflow to use script
3. Enforce 70% coverage threshold
4. Add coverage reporting to PRs
5. Identify uncovered critical paths

### FR-23: Smoke Test Implementation
**Priority:** Medium  
**CI/CD Pipeline**

**Requirements:**
1. Add test:smoke script to package.json
2. Create smoke tests for critical paths
3. Test authentication flow
4. Test trip creation flow
5. Test payment flow
6. Run smoke tests in CI/CD

### FR-24: Multi-Currency Support
**Priority:** Medium  
**Payment System**

**Requirements:**
1. Add currency field to venues and experiences
2. Support multi-currency pricing
3. Use Stripe currency conversion
4. Display prices in user's preferred currency
5. Handle currency in payment intents

### FR-25: Input Sanitization Improvements
**Priority:** Medium  
**Validation Utilities**

**Requirements:**
1. Install DOMPurify or sanitize-html
2. Replace basic sanitization with library
3. Sanitize all user inputs
4. Validate on both client and server
5. Add XSS protection tests

### FR-26: Phone Validation Improvements
**Priority:** Medium  
**Validation Utilities**

**Requirements:**
1. Install libphonenumber-js
2. Replace basic phone validation
3. Support international phone numbers
4. Validate country codes
5. Format phone numbers consistently

### FR-27: File Validation Improvements
**Priority:** Medium  
**Validation Utilities**

**Requirements:**
1. Add file size validation
2. Validate MIME type matches extension
3. Check file content (magic bytes)
4. Prevent malicious file uploads
5. Add file type whitelist

### FR-28: Monitoring Initialization
**Priority:** Medium  
**All Apps**

**Requirements:**
1. Initialize Sentry in each app's main.tsx
2. Set up Sentry project and get DSN
3. Configure environment-specific settings
4. Test error reporting
5. Set up error alerts

### FR-29: Error Context Improvements
**Priority:** Medium  
**Monitoring Service**

**Requirements:**
1. Include user info in error context
2. Add breadcrumbs for user actions
3. Capture request/response data
4. Add custom tags for filtering
5. Implement error grouping

### FR-30: Email Retry Improvements
**Priority:** Medium  
**Email Edge Function**

**Requirements:**
1. Implement exponential backoff with jitter
2. Add maximum retry limit
3. Log retry attempts
4. Handle permanent failures
5. Implement dead letter queue

### FR-31: SMS Opt-In Verification
**Priority:** Medium  
**SMS Edge Function**

**Requirements:**
1. Implement phone verification flow
2. Send verification code
3. Validate code before enabling SMS
4. Store verified phone numbers
5. Re-verify after phone change

### FR-32: Webhook Signature Verification
**Priority:** Medium  
**Stripe Webhook**

**Requirements:**
1. Add error handling for invalid signatures
2. Log signature verification failures
3. Return proper error responses
4. Monitor signature failures
5. Alert on repeated failures

### FR-33: Payment Metadata Validation
**Priority:** Medium  
**Stripe Webhook**

**Requirements:**
1. Validate all required metadata fields
2. Log missing metadata to monitoring
3. Create alerts for metadata issues
4. Handle missing metadata gracefully
5. Document required metadata fields

### FR-34: Refund Handling Improvements
**Priority:** Medium  
**Stripe Webhook**

**Requirements:**
1. Update permission slip status on refund
2. Send refund confirmation email
3. Update trip capacity
4. Log refund in audit trail
5. Handle partial refunds

### FR-35: TypeScript Strict Mode
**Priority:** Low  
**All Packages**

**Requirements:**
1. Enable strict mode in root tsconfig.json
2. Fix all strict mode errors
3. Enable noImplicitAny
4. Enable strictNullChecks
5. Enable all strict flags

### FR-36: Accessibility Improvements
**Priority:** Low  
**All Forms**

**Requirements:**
1. Audit all forms for ARIA labels
2. Add aria-label or aria-labelledby
3. Add aria-describedby for errors
4. Add aria-invalid for validation
5. Add role attributes where needed

### FR-37: Error Message Internationalization
**Priority:** Low  
**All Services**

**Requirements:**
1. Extract all error messages to i18n
2. Translate to ES and AR
3. Use translation keys in throw statements
4. Test all error messages
5. Document error message conventions

### FR-38: Loading State Improvements
**Priority:** Low  
**All Pages**

**Requirements:**
1. Add loading indicators to all pages
2. Create consistent LoadingSpinner component
3. Show skeleton screens for content
4. Handle loading errors
5. Add loading state tests

### FR-39: Empty State Improvements
**Priority:** Low  
**All Lists**

**Requirements:**
1. Design empty state component
2. Add illustrations or icons
3. Add descriptive messages
4. Add call-to-action buttons
5. Add help text

### FR-40: Pagination Implementation
**Priority:** Low  
**All Lists**

**Requirements:**
1. Implement pagination for trips list
2. Implement pagination for students list
3. Implement pagination for venues list
4. Add page size selector
5. Show total count

### FR-41: Optimistic Updates
**Priority:** Low  
**Form Submissions**

**Requirements:**
1. Update UI immediately on submission
2. Sync with server in background
3. Rollback on error
4. Show sync status
5. Handle conflicts

### FR-42: Request Deduplication
**Priority:** Low  
**Search Components**

**Requirements:**
1. Implement debouncing for search
2. Cancel in-flight requests
3. Deduplicate identical requests
4. Show loading state during debounce
5. Test with rapid input

## Non-Functional Requirements

### NFR-1: Performance
- All pages load in < 2 seconds
- API responses in < 500ms
- Edge Functions execute in < 1 second
- No memory leaks in long-running sessions

### NFR-2: Security
- All inputs validated and sanitized
- All errors handled gracefully
- No sensitive data in logs
- Rate limiting on all public endpoints
- HTTPS only in production

### NFR-3: Reliability
- 99.9% uptime for production
- Automatic retry for transient failures
- Graceful degradation when services unavailable
- Data consistency across all operations

### NFR-4: Maintainability
- Code coverage > 70%
- All functions documented
- Consistent code style
- No code duplication
- Clear error messages

### NFR-5: Scalability
- Support 10,000+ concurrent users
- Handle 1M+ database records
- Efficient database queries with indexes
- CDN for static assets
- Horizontal scaling capability

## Success Metrics

1. **Zero TypeScript Compilation Errors**
2. **Zero Console.log in Production Code**
3. **All 47 Issues Resolved**
4. **Test Coverage > 70%**
5. **All Critical User Flows Functional**
6. **Security Audit Passed**
7. **Performance Benchmarks Met**

## Out of Scope

- New feature development
- UI/UX redesign
- Database schema changes (except for missing tables)
- Third-party integrations beyond fixes
- Mobile app development

## Dependencies

- Supabase project configured
- Stripe account with Connect enabled
- Email service (SendGrid or Resend) configured
- SMS service (Twilio) configured
- Sentry project for monitoring
- Google Maps API key (or alternative)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes during fixes | High | Comprehensive testing, feature flags |
| Third-party API issues | Medium | Implement fallbacks, graceful degradation |
| Database migration failures | High | Test migrations in staging, backup data |
| Performance regression | Medium | Performance testing, monitoring |
| Security vulnerabilities | High | Security audit, penetration testing |

## Timeline

- **Phase 1 (Critical):** 1 week
- **Phase 2 (High Priority):** 2 weeks
- **Phase 3 (Medium Priority):** 2 weeks
- **Phase 4 (Low Priority):** 1 week
- **Total:** 6 weeks

## Approval

This spec must be approved before implementation begins. All critical and high-priority requirements are mandatory for production launch.
