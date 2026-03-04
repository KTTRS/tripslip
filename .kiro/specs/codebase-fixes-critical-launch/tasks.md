# Tasks: Codebase Fixes - Critical Launch Issues

## Overview
Fix all 47 issues identified in comprehensive codebase review. Tasks organized by priority phase.

---

## PHASE 1: CRITICAL FIXES (Week 1)

### Task Group 1: Type Errors & Compilation (Critical)

#### Task 1.1: Fix SchoolTripList Import Error
**Status:** pending  
**Priority:** Critical  
**Estimated Time:** 30 minutes

**Description:** Fix SchoolTripList component that imports non-existent `supabase` export from `@tripslip/database`.

**Requirements:**
- Create `apps/school/src/lib/supabase.ts` with centralized client
- Update SchoolTripList to import from lib/supabase
- Fix Trip type property names (name → title, total_cost → estimated_cost_cents)
- Verify component compiles without errors

**Acceptance Criteria:**
- [ ] No TypeScript compilation errors in SchoolTripList
- [ ] Component displays trips correctly
- [ ] All property names match database schema

**Files to Modify:**
- Create: `apps/school/src/lib/supabase.ts`
- Update: `apps/school/src/components/SchoolTripList.tsx`

---

#### Task 1.2: Fix TripCreationForm Deprecated Type
**Status:** pending  
**Priority:** Critical  
**Estimated Time:** 15 minutes

**Description:** Fix deprecated FormEvent usage in TripCreationForm.

**Requirements:**
- Replace `React.FormEvent` with `React.FormEvent<HTMLFormElement>`
- Verify no TypeScript warnings
- Test form submission still works

**Acceptance Criteria:**
- [ ] No deprecation warnings
- [ ] Form submission functional
- [ ] Type safety maintained

**Files to Modify:**
- `apps/teacher/src/components/TripCreationForm.tsx`

---

### Task Group 2: Environment & Configuration (Critical)

#### Task 2.1: Create Environment Validation Utility
**Status:** pending  
**Priority:** Critical  
**Estimated Time:** 1 hour

**Description:** Create centralized environment variable validation to prevent runtime failures.

**Requirements:**
- Create `packages/utils/src/env-validation.ts`
- Define EnvConfig interface
- Implement validateEnv function with clear error messages
- Create app-specific configs (TEACHER_APP_ENV, PARENT_APP_ENV, etc.)
- Export from packages/utils/src/index.ts

**Acceptance Criteria:**
- [ ] Utility validates required env vars
- [ ] Clear error messages for missing vars
- [ ] Warns about optional missing vars
- [ ] Unit tests for validation logic

**Files to Create:**
- `packages/utils/src/env-validation.ts`

**Files to Update:**
- `packages/utils/src/index.ts`

---

#### Task 2.2: Add Environment Validation to All Apps
**Status:** pending  
**Priority:** Critical  
**Estimated Time:** 1 hour

**Description:** Add env validation to each app's main.tsx before rendering.

**Requirements:**
- Import validateEnv and app-specific config in each main.tsx
- Call validateEnv before ReactDOM.createRoot
- Test with missing env vars to verify error messages
- Update .env.example with all required vars

**Acceptance Criteria:**
- [ ] All apps validate env vars at startup
- [ ] Clear error messages displayed
- [ ] Apps fail fast with helpful info
- [ ] .env.example is complete

**Files to Update:**
- `apps/landing/src/main.tsx`
- `apps/venue/src/main.tsx`
- `apps/school/src/main.tsx`
- `apps/teacher/src/main.tsx`
- `apps/parent/src/main.tsx`
- `.env.example`

---

### Task Group 3: Logging & Monitoring (Critical)

#### Task 3.1: Create Logger Utility
**Status:** pending  
**Priority:** Critical  
**Estimated Time:** 1.5 hours

**Description:** Create production-ready logging utility to replace console.log statements.

**Requirements:**
- Create `packages/utils/src/logger.ts`
- Implement Logger class with debug/info/warn/error methods
- Use Sentry in production, console in development
- Add breadcrumbs for debugging
- Export singleton logger instance

**Acceptance Criteria:**
- [ ] Logger works in dev and prod
- [ ] Integrates with Sentry
- [ ] Proper log levels
- [ ] Unit tests for logger

**Files to Create:**
- `packages/utils/src/logger.ts`

**Files to Update:**
- `packages/utils/src/index.ts`

---

#### Task 3.2: Replace Console.log Statements
**Status:** pending  
**Priority:** Critical  
**Estimated Time:** 2 hours

**Description:** Replace all console.log statements with logger utility.

**Requirements:**
- Find all console.log in apps/ and packages/
- Replace with appropriate logger method (debug/info/warn/error)
- Remove sensitive data from logs
- Add ESLint rule to prevent future console.log
- Test logging in development

**Acceptance Criteria:**
- [ ] Zero console.log in production code (except tests)
- [ ] ESLint rule enforced
- [ ] All logs use logger utility
- [ ] No sensitive data in logs

**Files to Update:**
- 15+ files with console.log statements (see review report)
- `.eslintrc.json`

---

#### Task 3.3: Initialize Monitoring Service
**Status:** pending  
**Priority:** Critical  
**Estimated Time:** 1 hour

**Description:** Initialize Sentry monitoring in all apps.

**Requirements:**
- Add Sentry DSN to env vars
- Initialize Sentry in each app's main.tsx
- Configure environment-specific settings
- Test error reporting
- Set up error alerts

**Acceptance Criteria:**
- [ ] Sentry initialized in all apps
- [ ] Errors captured and reported
- [ ] User context included
- [ ] Breadcrumbs working

**Files to Update:**
- `apps/landing/src/main.tsx`
- `apps/venue/src/main.tsx`
- `apps/school/src/main.tsx`
- `apps/teacher/src/main.tsx`
- `apps/parent/src/main.tsx`
- `.env.example`

---

### Task Group 4: Error Handling (Critical)

#### Task 4.1: Create Error Handling Utility
**Status:** pending

---

## PHASE 3: MEDIUM PRIORITY FIXES (Weeks 4-5)

### Task Group 7: Code Quality & Architecture (Medium)

#### Task 25: Centralize Supabase Client Creation
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 3 hours

**Description:** Create centralized Supabase client in each app to eliminate inline client creation and improve testability.

**Requirements:**
- Create `lib/supabase.ts` in each app (landing, venue, school, teacher, parent)
- Export singleton Supabase client instance
- Replace all inline `createSupabaseClient()` calls with imports
- Update all component and service imports
- Verify environment variables are validated before client creation
- Add JSDoc documentation for client usage

**Acceptance Criteria:**
- [x] Each app has centralized lib/supabase.ts file
- [x] Zero inline Supabase client creation in components
- [x] All imports updated to use centralized client
- [x] Client creation fails fast with clear error if env vars missing
- [x] Improved testability with single client instance

**Files to Create:**
- `apps/landing/src/lib/supabase.ts`
- `apps/venue/src/lib/supabase.ts`
- `apps/school/src/lib/supabase.ts` (already exists)
- `apps/teacher/src/lib/supabase.ts`
- `apps/parent/src/lib/supabase.ts`

**Files to Update:**
- All component files that create Supabase clients inline
- All service files that import from @tripslip/database

---

#### Task 26: Test Coverage Improvements
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 4 hours

**Description:** Improve test coverage to meet 70% threshold and add coverage enforcement to CI/CD.

**Requirements:**
- Create `scripts/check-coverage.js` script
- Parse coverage-summary.json and check threshold
- Update CI workflow to run coverage check
- Fail build if coverage below 70%
- Add coverage badge to README
- Identify and document uncovered critical paths
- Create test plan for uncovered areas

**Acceptance Criteria:**
- [x] Coverage check script created and working
- [x] CI/CD enforces 70% coverage threshold
- [x] Coverage reports generated on each PR
- [x] Critical paths identified and documented
- [x] Test plan created for improving coverage

**Files to Create:**
- `scripts/check-coverage.js`

**Files to Update:**
- `.github/workflows/ci.yml`
- `README.md`
- `package.json` (add coverage scripts)

---

#### Task 27: Smoke Test Implementation
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 4 hours

**Description:** Implement smoke tests for critical user flows to catch major regressions quickly.

**Requirements:**
- Create `tests/smoke/` directory
- Implement authentication flow smoke test
- Implement trip creation flow smoke test
- Implement payment flow smoke test
- Add test:smoke script to package.json
- Run smoke tests in CI/CD before full test suite
- Document smoke test patterns

**Acceptance Criteria:**
- [x] Smoke tests cover 3 critical flows
- [x] Tests run in < 2 minutes
- [x] CI/CD runs smoke tests first
- [x] Clear failure messages for each flow
- [x] Documentation for adding new smoke tests

**Files to Create:**
- `tests/smoke/auth-flow.test.ts`
- `tests/smoke/trip-creation-flow.test.ts`
- `tests/smoke/payment-flow.test.ts`
- `tests/smoke/README.md`

**Files to Update:**
- `package.json`
- `.github/workflows/ci.yml`

---

### Task Group 8: Payment & Financial (Medium)

#### Task 28: Multi-Currency Support
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 6 hours

**Description:** Add multi-currency support to venues, experiences, and payment processing.

**Requirements:**
- Add currency field to venues table (default: 'usd')
- Add currency field to experiences table
- Update Stripe payment intent creation to use currency
- Display prices in correct currency format
- Support currency conversion display (optional)
- Update all price displays to show currency symbol
- Test with multiple currencies (USD, EUR, GBP, CAD)

**Acceptance Criteria:**
- [ ] Database schema updated with currency fields
- [ ] Stripe payment intents use correct currency
- [ ] Prices display with correct currency symbol
- [ ] Currency persists through payment flow
- [ ] Tests cover multiple currencies

**Files to Create:**
- `supabase/migrations/20240306000001_add_currency_support.sql`
- `packages/utils/src/currency-formatter.ts`

**Files to Update:**
- `packages/database/src/types.ts`
- `supabase/functions/create-payment-intent/index.ts`
- `apps/venue/src/components/ExperienceCreationForm.tsx`
- `apps/parent/src/components/PaymentForm.tsx`
- `apps/teacher/src/components/venue-search/VenueCard.tsx`

---

### Task Group 9: Security & Validation (Medium)

#### Task 29: Input Sanitization Improvements (DOMPurify)
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 3 hours

**Description:** Replace basic input sanitization with DOMPurify library for better XSS protection.

**Requirements:**
- Install DOMPurify package
- Create sanitization utility wrapper
- Replace basic sanitization in validation utils
- Sanitize all user-generated content before display
- Sanitize rich text editor content
- Add XSS protection tests
- Document sanitization patterns

**Acceptance Criteria:**
- [ ] DOMPurify installed and configured
- [ ] All user inputs sanitized before storage
- [ ] All user content sanitized before display
- [ ] XSS tests pass
- [ ] No breaking changes to existing functionality

**Files to Create:**
- `packages/utils/src/sanitization.ts`
- `packages/utils/src/__tests__/sanitization.test.ts`

**Files to Update:**
- `packages/utils/src/validation.ts`
- `package.json` (add DOMPurify dependency)
- All components displaying user-generated content

---

#### Task 30: Phone Validation Improvements (libphonenumber)
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:** Replace basic phone validation with libphonenumber-js for international phone support.

**Requirements:**
- Install libphonenumber-js package
- Update phone validation utility
- Support international phone numbers
- Validate country codes
- Format phone numbers consistently
- Add phone number parsing utility
- Test with various international formats

**Acceptance Criteria:**
- [ ] libphonenumber-js integrated
- [ ] International phone numbers validated correctly
- [ ] Phone numbers formatted consistently
- [ ] Country code validation working
- [ ] Tests cover multiple countries

**Files to Create:**
- `packages/utils/src/phone-validation.ts`
- `packages/utils/src/__tests__/phone-validation.test.ts`

**Files to Update:**
- `packages/utils/src/validation.ts`
- `package.json` (add libphonenumber-js dependency)
- All forms with phone number inputs

---

#### Task 31: File Validation Improvements
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:** Enhance file upload validation to prevent malicious file uploads.

**Requirements:**
- Add file size validation (max 10MB)
- Validate MIME type matches file extension
- Check file content magic bytes
- Implement file type whitelist
- Add virus scanning placeholder (for future)
- Improve error messages for file validation
- Test with various file types

**Acceptance Criteria:**
- [ ] File size limits enforced
- [ ] MIME type validation working
- [ ] Magic byte checking implemented
- [ ] Whitelist prevents dangerous file types
- [ ] Clear error messages for users

**Files to Create:**
- `packages/utils/src/file-validation.ts`
- `packages/utils/src/__tests__/file-validation.test.ts`

**Files to Update:**
- `packages/utils/src/validation.ts`
- All file upload components

---

### Task Group 10: Monitoring & Error Handling (Medium)

#### Task 32: Error Context Improvements
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:** Enhance error reporting with better context, breadcrumbs, and user information.

**Requirements:**
- Add user context to all error reports
- Implement breadcrumb tracking for user actions
- Capture request/response data in errors
- Add custom tags for error filtering
- Implement error grouping by type
- Add environment context to errors
- Test error reporting in development

**Acceptance Criteria:**
- [ ] User info included in all error reports
- [ ] Breadcrumbs track user journey
- [ ] Request/response data captured
- [ ] Custom tags enable filtering
- [ ] Errors grouped intelligently

**Files to Update:**
- `packages/utils/src/monitoring.ts`
- `packages/utils/src/logger.ts`
- `packages/utils/src/error-handling.ts`

---

#### Task 33: Email Retry Improvements (Exponential Backoff)
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:** Implement exponential backoff with jitter for email retry logic.

**Requirements:**
- Implement exponential backoff algorithm
- Add jitter to prevent thundering herd
- Set maximum retry limit (5 attempts)
- Log all retry attempts
- Handle permanent failures (bounce, invalid email)
- Implement dead letter queue for failed emails
- Update email Edge Function

**Acceptance Criteria:**
- [ ] Exponential backoff implemented
- [ ] Jitter prevents simultaneous retries
- [ ] Max retry limit enforced
- [ ] Permanent failures handled
- [ ] Dead letter queue functional

**Files to Update:**
- `supabase/functions/send-email/index.ts`
- `packages/utils/src/retry-logic.ts` (create)

---

#### Task 34: SMS Opt-In Verification
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 4 hours

**Description:** Implement phone verification flow before enabling SMS notifications.

**Requirements:**
- Create phone verification flow
- Send verification code via SMS
- Validate code before enabling SMS
- Store verified phone numbers
- Re-verify after phone number change
- Add rate limiting for verification codes
- Update SMS Edge Function to check verification

**Acceptance Criteria:**
- [ ] Verification flow implemented
- [ ] Codes sent and validated correctly
- [ ] Only verified numbers receive SMS
- [ ] Re-verification on phone change
- [ ] Rate limiting prevents abuse

**Files to Create:**
- `supabase/migrations/20240306000002_add_phone_verification.sql`
- `packages/database/src/phone-verification-service.ts`
- `apps/parent/src/components/PhoneVerificationDialog.tsx`

**Files to Update:**
- `supabase/functions/send-sms/index.ts`

---

### Task Group 11: Webhook & Payment Security (Medium)

#### Task 35: Webhook Signature Verification
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:** Enhance webhook signature verification with better error handling and monitoring.

**Requirements:**
- Add detailed error handling for invalid signatures
- Log all signature verification failures
- Return proper HTTP error responses
- Monitor signature failure rate
- Alert on repeated signature failures
- Document webhook security best practices
- Test with invalid signatures

**Acceptance Criteria:**
- [ ] Invalid signatures logged and monitored
- [ ] Proper error responses returned
- [ ] Alerts configured for failures
- [ ] Documentation updated
- [ ] Tests cover invalid signatures

**Files to Update:**
- `supabase/functions/stripe-webhook/index.ts`
- `docs/webhooks-security.md` (create)

---

#### Task 36: Payment Metadata Validation
**Status:** completed  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:** Validate all required metadata fields in payment intents and log missing metadata.

**Requirements:**
- Define required metadata fields
- Validate metadata in webhook handler
- Log missing metadata to monitoring
- Create alerts for metadata issues
- Handle missing metadata gracefully
- Document required metadata fields
- Add metadata validation tests

**Acceptance Criteria:**
- [ ] All required metadata validated
- [ ] Missing metadata logged
- [ ] Alerts configured
- [ ] Graceful handling of missing data
- [ ] Documentation complete

**Files to Update:**
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/create-payment-intent/index.ts`
- `docs/payment-metadata.md` (create)

---

#### Task 37: Refund Handling Improvements
**Status:** pending  
**Priority:** Medium  
**Estimated Time:** 3 hours

**Description:** Improve refund handling to update all related records and send notifications.

**Requirements:**
- Update permission slip status on refund
- Send refund confirmation email to parent
- Update trip capacity (add back slot)
- Log refund in audit trail
- Handle partial refunds correctly
- Update payment history display
- Test full and partial refunds

**Acceptance Criteria:**
- [ ] Permission slip status updated
- [ ] Confirmation emails sent
- [ ] Trip capacity updated correctly
- [ ] Audit trail complete
- [ ] Partial refunds handled

**Files to Update:**
- `supabase/functions/stripe-webhook/index.ts`
- `packages/database/src/refund-service.ts`
- `supabase/functions/send-email/index.ts` (add refund template)

---

#### Task 38: Remove Example Files from Production
**Status:** pending  
**Priority:** Medium  
**Estimated Time:** 1 hour

**Description:** Remove or exclude example files from production builds.

**Requirements:**
- Identify all example-usage.ts files
- Add .example.ts pattern to .gitignore for builds
- Update build configuration to exclude examples
- Move examples to docs/ directory
- Update documentation to reference new locations
- Verify examples not in production bundles

**Acceptance Criteria:**
- [ ] No example files in production builds
- [ ] Examples moved to docs/
- [ ] Build config updated
- [ ] Documentation updated
- [ ] Bundle size reduced

**Files to Update:**
- `vite.config.ts` (all apps)
- `.gitignore`
- Move all `example-usage.ts` files to `docs/examples/`

---

## PHASE 4: LOW PRIORITY IMPROVEMENTS (Week 6)

### Task Group 12: TypeScript & Code Quality (Low)

#### Task 39: Enable TypeScript Strict Mode
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 8 hours

**Description:** Enable TypeScript strict mode across all packages to improve type safety.

**Requirements:**
- Enable strict mode in root tsconfig.json
- Enable noImplicitAny
- Enable strictNullChecks
- Enable strictFunctionTypes
- Enable strictBindCallApply
- Enable strictPropertyInitialization
- Fix all strict mode errors incrementally
- Test all packages after enabling

**Acceptance Criteria:**
- [ ] Strict mode enabled in tsconfig
- [ ] All strict flags enabled
- [ ] Zero TypeScript errors
- [ ] All packages compile successfully
- [ ] Tests pass with strict mode

**Files to Update:**
- `tsconfig.json` (root)
- All packages with type errors
- Fix ~50-100 type errors across codebase

---

### Task Group 13: Accessibility & UX (Low)

#### Task 40: Accessibility Improvements (ARIA Labels)
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 4 hours

**Description:** Audit and improve accessibility with proper ARIA labels and attributes.

**Requirements:**
- Audit all forms for ARIA labels
- Add aria-label or aria-labelledby to inputs
- Add aria-describedby for error messages
- Add aria-invalid for validation states
- Add role attributes where needed
- Test with screen reader
- Document accessibility patterns

**Acceptance Criteria:**
- [ ] All forms have proper ARIA labels
- [ ] Error messages announced correctly
- [ ] Validation states accessible
- [ ] Screen reader testing passed
- [ ] Documentation complete

**Files to Update:**
- All form components across all apps
- `docs/accessibility-guide.md` (create)

---

#### Task 41: Error Message Internationalization
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 3 hours

**Description:** Extract all error messages to i18n and translate to ES and AR.

**Requirements:**
- Extract all error messages to translation files
- Create error message keys in i18n
- Translate to Spanish (ES)
- Translate to Arabic (AR)
- Update all throw statements to use i18n keys
- Test error messages in all languages
- Document error message conventions

**Acceptance Criteria:**
- [ ] All error messages in i18n files
- [ ] ES translations complete
- [ ] AR translations complete
- [ ] Error messages display in user's language
- [ ] Documentation updated

**Files to Update:**
- `packages/i18n/src/locales/en/errors.json` (create)
- `packages/i18n/src/locales/es/errors.json` (create)
- `packages/i18n/src/locales/ar/errors.json` (create)
- All service files with error messages

---

#### Task 42: Loading State Improvements
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 3 hours

**Description:** Add consistent loading indicators and skeleton screens across all pages.

**Requirements:**
- Create LoadingSpinner component in packages/ui
- Create SkeletonLoader component for content
- Add loading states to all async operations
- Show skeleton screens during data fetching
- Handle loading errors gracefully
- Add loading state tests
- Document loading patterns

**Acceptance Criteria:**
- [ ] Consistent loading indicators
- [ ] Skeleton screens for all lists
- [ ] Loading errors handled
- [ ] Tests cover loading states
- [ ] Documentation complete

**Files to Create:**
- `packages/ui/src/LoadingSpinner.tsx`
- `packages/ui/src/SkeletonLoader.tsx`

**Files to Update:**
- All page components with async data

---

#### Task 43: Empty State Improvements
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 3 hours

**Description:** Design and implement consistent empty state components with helpful CTAs.

**Requirements:**
- Create EmptyState component in packages/ui
- Add illustrations or icons
- Add descriptive messages
- Add call-to-action buttons
- Add help text or tips
- Apply to all list views
- Test empty states

**Acceptance Criteria:**
- [ ] EmptyState component created
- [ ] Applied to all list views
- [ ] Helpful messages and CTAs
- [ ] Consistent design
- [ ] Tests cover empty states

**Files to Create:**
- `packages/ui/src/EmptyState.tsx`

**Files to Update:**
- All list components (trips, students, venues, etc.)

---

#### Task 44: Pagination Implementation
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 4 hours

**Description:** Implement pagination for all list views to improve performance.

**Requirements:**
- Create Pagination component in packages/ui
- Implement pagination for trips list
- Implement pagination for students list
- Implement pagination for venues list
- Add page size selector (10, 25, 50, 100)
- Show total count and current range
- Persist pagination state in URL
- Test pagination with large datasets

**Acceptance Criteria:**
- [ ] Pagination component created
- [ ] All lists paginated
- [ ] Page size selector working
- [ ] URL state persistence
- [ ] Performance improved

**Files to Create:**
- `packages/ui/src/Pagination.tsx`

**Files to Update:**
- `apps/teacher/src/pages/TripsPage.tsx`
- `apps/teacher/src/pages/StudentsPage.tsx`
- `apps/teacher/src/pages/VenueSearchPage.tsx`
- All other list pages

---

### Task Group 14: Performance & Optimization (Low)

#### Task 45: Optimistic Updates
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 4 hours

**Description:** Implement optimistic UI updates for better perceived performance.

**Requirements:**
- Update UI immediately on form submission
- Sync with server in background
- Rollback on server error
- Show sync status indicator
- Handle conflicts gracefully
- Apply to trip creation, student addition, etc.
- Test optimistic updates

**Acceptance Criteria:**
- [ ] UI updates immediately
- [ ] Background sync working
- [ ] Rollback on errors
- [ ] Conflict handling implemented
- [ ] Tests cover optimistic updates

**Files to Update:**
- `apps/teacher/src/stores/tripCreationStore.ts`
- `apps/teacher/src/stores/studentsStore.ts`
- All forms with async submissions

---

#### Task 46: Request Deduplication
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 2 hours

**Description:** Implement request deduplication and debouncing for search and autocomplete.

**Requirements:**
- Implement debouncing for search inputs
- Cancel in-flight requests on new input
- Deduplicate identical requests
- Show loading state during debounce
- Test with rapid input changes
- Apply to venue search, student search, etc.
- Document debouncing patterns

**Acceptance Criteria:**
- [ ] Search inputs debounced (300ms)
- [ ] In-flight requests cancelled
- [ ] Identical requests deduplicated
- [ ] Loading states correct
- [ ] Tests cover rapid input

**Files to Create:**
- `packages/utils/src/request-deduplication.ts`

**Files to Update:**
- `apps/teacher/src/pages/VenueSearchPage.tsx`
- `apps/teacher/src/components/StudentSearch.tsx`
- All search/autocomplete components

---

#### Task 47: Verbose Logging Cleanup in Scripts
**Status:** pending  
**Priority:** Low  
**Estimated Time:** 1 hour

**Description:** Clean up verbose console output in build and deployment scripts.

**Requirements:**
- Review all npm scripts for verbose output
- Remove unnecessary console.log from scripts
- Add --quiet flag where appropriate
- Keep only essential output
- Add --verbose flag for debugging
- Update script documentation
- Test all scripts

**Acceptance Criteria:**
- [ ] Scripts output only essential info
- [ ] --quiet flag available
- [ ] --verbose flag for debugging
- [ ] Documentation updated
- [ ] All scripts tested

**Files to Update:**
- `package.json` (all script definitions)
- `scripts/*.js` (all custom scripts)
- `turbo.json` (output configuration)

---

## Summary

**Total Tasks:** 47
- Phase 1 (Critical): 9 tasks - ✅ COMPLETE
- Phase 2 (High Priority): 15 tasks - ✅ 14 COMPLETE (Task 13 optional)
- Phase 3 (Medium Priority): 14 tasks - ⏳ READY TO EXECUTE
- Phase 4 (Low Priority): 9 tasks - ⏳ READY TO EXECUTE

**Remaining Work:**
- Phase 3: ~40 hours
- Phase 4: ~32 hours
- Total: ~72 hours

All task details are now complete and ready for execution.
