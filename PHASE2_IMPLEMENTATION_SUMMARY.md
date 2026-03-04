# Phase 2 Implementation Summary

## Overview
This document summarizes the implementation status of Phase 2 High Priority Tasks (10-24) from the codebase-fixes-critical-launch spec.

---

## ✅ Task 10: Implement School Auth Context (COMPLETED)

**Status:** Complete  
**Time:** 3 hours

### What Was Implemented

1. **Created SchoolAuthContext** (`apps/school/src/contexts/SchoolAuthContext.tsx`)
   - Extends RBAC auth with school-specific data
   - Fetches school administrator profile from database
   - Provides: `schoolId`, `administratorId`, `administratorName`, `schoolName`, `role`
   - Includes loading and error states

2. **Updated Components to Use Real Data**
   - `ApprovalsPage.tsx`: Replaced hardcoded `default-school-id` with real `schoolId`
   - `DashboardPage.tsx`: Uses real `schoolId` from context
   - `TeachersPage.tsx`: Uses real `schoolId` from context
   - `TripApprovalModal.tsx`: Uses real `administratorId` and `administratorName`

3. **Added Error Handling**
   - Shows error message if no school association found
   - Handles loading states properly
   - Prevents queries when schoolId is null

### Files Modified
- ✅ `apps/school/src/contexts/SchoolAuthContext.tsx` (created)
- ✅ `apps/school/src/pages/ApprovalsPage.tsx`
- ✅ `apps/school/src/pages/DashboardPage.tsx`
- ✅ `apps/school/src/pages/TeachersPage.tsx`
- ✅ `apps/school/src/components/TripApprovalModal.tsx`

---

## 📋 Task 11: PDF Receipt Generation (4h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Install jsPDF**
   ```bash
   npm install jspdf --workspace=@tripslip/utils
   ```

2. **Create PDF Generator Utility** (`packages/utils/src/pdf-generator.ts`)
   - `generateReceipt()` function
   - TripSlip branding and logo
   - Multi-language support (EN/ES/AR)
   - Receipt data: payment ID, parent/student info, trip details, amount

3. **Storage Integration**
   - `saveReceiptToStorage()` function
   - Upload to Supabase Storage `documents/receipts/` bucket
   - Return public URL

4. **Update Components**
   - `apps/parent/src/pages/PaymentSuccessPage.tsx`: Add download button
   - `apps/parent/src/components/PaymentHistory.tsx`: Add download links

### Files to Create/Modify
- Create: `packages/utils/src/pdf-generator.ts`
- Update: `packages/utils/src/index.ts`
- Update: `apps/parent/src/pages/PaymentSuccessPage.tsx`
- Update: `apps/parent/src/components/PaymentHistory.tsx`

---

## 📋 Task 12: Draft Saving Implementation (4h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Database Migration**
   ```sql
   -- supabase/migrations/20240305000001_create_trip_drafts.sql
   CREATE TABLE trip_drafts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
     draft_data JSONB NOT NULL,
     last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE(teacher_id)
   );
   CREATE INDEX idx_trip_drafts_teacher ON trip_drafts(teacher_id);
   ```

2. **Update Trip Creation Store** (`apps/teacher/src/stores/tripCreationStore.ts`)
   - Add `saveDraft()` method
   - Add `loadDraft()` method
   - Add `clearDraft()` method
   - Add `isDraft` and `lastSaved` state

3. **Auto-save Hook** (`apps/teacher/src/hooks/useAutoSave.ts`)
   - Auto-save every 30 seconds
   - Save on navigation away

4. **UI Updates**
   - Show "Draft saved at..." indicator
   - Show "Resume Draft" button on dashboard
   - Clear draft after successful submission

### Files to Create/Modify
- Create: `supabase/migrations/20240305000001_create_trip_drafts.sql`
- Update: `apps/teacher/src/stores/tripCreationStore.ts`
- Create: `apps/teacher/src/hooks/useAutoSave.ts`
- Update: `apps/teacher/src/pages/DashboardPage.tsx`

---

## 📋 Task 13: Stripe Connect Integration (8h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Database Migration**
   ```sql
   ALTER TABLE venues ADD COLUMN stripe_account_id TEXT;
   ALTER TABLE venues ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
   CREATE INDEX idx_venues_stripe_account ON venues(stripe_account_id);
   ```

2. **Onboarding Flow** (`apps/venue/src/pages/StripeOnboardingPage.tsx`)
   - Create Stripe Connect account
   - Generate onboarding link
   - Handle return from Stripe
   - Update venue record

3. **Payout Dashboard** (`apps/venue/src/pages/PayoutsPage.tsx`)
   - Display payout history
   - Show payout schedule
   - Display balance

4. **Webhook Handler** (`supabase/functions/stripe-webhook/index.ts`)
   - Handle `account.updated` events
   - Handle `payout.paid` events
   - Handle `payout.failed` events

### Files to Create/Modify
- Create: `supabase/migrations/20240305000002_add_stripe_connect.sql`
- Create: `apps/venue/src/pages/StripeOnboardingPage.tsx`
- Create: `apps/venue/src/pages/PayoutsPage.tsx`
- Update: `supabase/functions/stripe-webhook/index.ts`

---

## 📋 Task 14: Google Maps Integration (3h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Environment Variable**
   - Add `VITE_GOOGLE_MAPS_API_KEY` to `.env.example`
   - Add validation in env-validation utility

2. **Uncomment Map Code** (`apps/teacher/src/components/VenueMapView.tsx`)
   - Uncomment Google Maps initialization
   - Add API key from env
   - Implement marker click handlers

3. **Fallback Implementation**
   - Show static map or list view if API key missing
   - Display helpful message about API key

### Files to Modify
- Update: `.env.example`
- Update: `packages/utils/src/env-validation.ts`
- Update: `apps/teacher/src/components/VenueMapView.tsx`

---

## 📋 Task 15: Email Notification Implementation (4h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Update Trip Creation** (`apps/teacher/src/components/TripCreationForm.tsx`)
   - Call send-email Edge Function after trip creation
   - Batch email sending for multiple parents
   - Show notification status

2. **Add Retry Logic** (`supabase/functions/send-email/index.ts`)
   - Implement exponential backoff
   - Track retry attempts in email_logs table
   - Handle permanent failures

3. **Status Tracking**
   - Update email_logs table with delivery status
   - Show status to teacher in UI

### Files to Modify
- Update: `apps/teacher/src/components/TripCreationForm.tsx`
- Update: `supabase/functions/send-email/index.ts`
- Update: `apps/teacher/src/pages/TripDetailPage.tsx` (show email status)

---

## 📋 Task 16: Venue Employee Invitations (3h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Email Template** (`supabase/functions/send-email/templates/employee-invitation.ts`)
   - Create invitation email template
   - Include magic link for account setup
   - Multi-language support

2. **Invitation Service** (`packages/database/src/venue-employee-service.ts`)
   - `sendInvitation()` method
   - Generate magic link token
   - Track invitation status
   - Handle expiration (7 days)

3. **UI Updates** (`apps/venue/src/pages/EmployeesPage.tsx`)
   - Add "Invite Employee" button
   - Show invitation status
   - Allow resending invitations

### Files to Create/Modify
- Create: `supabase/functions/send-email/templates/employee-invitation.ts`
- Create: `packages/database/src/venue-employee-service.ts`
- Update: `apps/venue/src/pages/EmployeesPage.tsx`

---

## 📋 Task 17: Search Category Facets (4h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Category System**
   - Use existing `venue_categories` table
   - Add category filtering to search query

2. **Update Search Service** (`packages/database/src/search-service.ts`)
   - Add `categories` parameter
   - Support multi-select filtering
   - Return category counts in results

3. **UI Updates** (`apps/teacher/src/components/VenueSearch.tsx`)
   - Add category filter checkboxes
   - Show category counts
   - Update results on category selection

### Files to Modify
- Update: `packages/database/src/search-service.ts`
- Update: `apps/teacher/src/components/VenueSearch.tsx`

---

## 📋 Task 18: Resend Verification Email (2h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Resend Function** (`packages/auth/src/resend-verification.ts`)
   - Use Supabase Auth `resend()` method
   - Add rate limiting (max 3 per hour)
   - Track attempts in database

2. **UI Updates**
   - Add "Resend Verification" button to email verification page
   - Show success/error messages
   - Disable button after 3 attempts

### Files to Create/Modify
- Create: `packages/auth/src/resend-verification.ts`
- Update: `apps/*/src/pages/EmailVerificationPage.tsx` (all apps)

---

## 📋 Task 19: Last Login Tracking (2h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Database Migration**
   ```sql
   ALTER TABLE teachers ADD COLUMN last_login_at TIMESTAMPTZ;
   CREATE INDEX idx_teachers_last_login ON teachers(last_login_at);
   ```

2. **Auth Hook** (`packages/auth/src/use-login-tracker.ts`)
   - Update `last_login_at` on successful login
   - Use Supabase auth state change listener

3. **UI Display** (`apps/school/src/components/TeacherList.tsx`)
   - Show last login date
   - Show "Never logged in" for null values

### Files to Create/Modify
- Create: `supabase/migrations/20240305000003_add_last_login.sql`
- Create: `packages/auth/src/use-login-tracker.ts`
- Update: `apps/school/src/components/TeacherList.tsx`

---

## 📋 Task 20: Venue Navigation Handlers (2h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Add Route** (`apps/teacher/src/App.tsx`)
   - Add `/venues/:venueId` route
   - Create VenueDetailPage component

2. **Update Navigation**
   - `VenueSearch.tsx`: Add onClick to navigate to venue detail
   - `VenueMapView.tsx`: Add marker click to navigate
   - Use React Router `useNavigate()`

### Files to Create/Modify
- Create: `apps/teacher/src/pages/VenueDetailPage.tsx`
- Update: `apps/teacher/src/App.tsx`
- Update: `apps/teacher/src/components/VenueSearch.tsx`
- Update: `apps/teacher/src/components/VenueMapView.tsx`

---

## 📋 Task 21: School Association in Trips (2h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Update Trip Creation** (`apps/teacher/src/components/TripCreationForm.tsx`)
   - Fetch teacher profile with school relationship
   - Include `school_id` in trip creation payload
   - Validate school exists

2. **Display School Name** (`apps/teacher/src/pages/TripDetailPage.tsx`)
   - Show school name in trip details
   - Fetch from teacher.schools relationship

### Files to Modify
- Update: `apps/teacher/src/components/TripCreationForm.tsx`
- Update: `apps/teacher/src/pages/TripDetailPage.tsx`

---

## 📋 Task 22: Create Logging Tables (3h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Database Migrations**
   ```sql
   -- Rate limits table
   CREATE TABLE rate_limits (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     identifier TEXT NOT NULL,
     action TEXT NOT NULL,
     count INTEGER NOT NULL DEFAULT 1,
     window_start TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, action, window_start);

   -- SMS logs table
   CREATE TABLE sms_logs (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     phone_number TEXT NOT NULL,
     message TEXT NOT NULL,
     status TEXT NOT NULL,
     provider_id TEXT,
     error_message TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX idx_sms_logs_phone ON sms_logs(phone_number);
   CREATE INDEX idx_sms_logs_created ON sms_logs(created_at);

   -- Email logs table
   CREATE TABLE email_logs (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     recipient_email TEXT NOT NULL,
     subject TEXT NOT NULL,
     template TEXT NOT NULL,
     status TEXT NOT NULL,
     provider_id TEXT,
     error_message TEXT,
     retry_count INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
   CREATE INDEX idx_email_logs_created ON email_logs(created_at);
   ```

2. **Update Edge Functions**
   - `send-email/index.ts`: Log to email_logs table
   - `send-sms/index.ts`: Log to sms_logs table

### Files to Create/Modify
- Create: `supabase/migrations/20240305000004_create_logging_tables.sql`
- Update: `supabase/functions/send-email/index.ts`
- Update: `supabase/functions/send-sms/index.ts`

---

## 📋 Task 23: Fix Hardcoded Default Values (2h)

**Status:** Partially Complete  
**Priority:** High

### What Was Completed
- ✅ School app: Replaced hardcoded `default-school-id` with real `schoolId`
- ✅ School app: Replaced hardcoded admin info with real `administratorId` and `administratorName`

### Remaining Work
1. **Search Other Apps for Hardcoded Values**
   ```bash
   grep -r "default-" apps/
   grep -r "TODO.*hardcoded" apps/
   grep -r "FIXME" apps/
   ```

2. **Common Patterns to Fix**
   - Default IDs (user-id, venue-id, etc.)
   - Placeholder names
   - Test data in production code

### Files to Check
- All apps in `apps/` directory
- Look for TODO/FIXME comments

---

## 📋 Task 24: Implement Missing TODO Features (4h)

**Status:** Not Started  
**Priority:** High

### Implementation Plan

1. **Find All TODOs**
   ```bash
   grep -r "TODO" apps/ packages/ --include="*.ts" --include="*.tsx" > todos.txt
   ```

2. **Categorize TODOs**
   - Critical: Features that block functionality
   - High: Features that improve UX
   - Low: Nice-to-have improvements

3. **Implement Critical TODOs**
   - Focus on user-facing features
   - Implement proper error handling
   - Remove TODO markers after implementation

4. **Document Remaining TODOs**
   - Create issues for non-critical TODOs
   - Add to backlog for future sprints

### Process
1. Run grep to find all TODOs
2. Review each TODO
3. Implement or document
4. Remove TODO marker

---

## Summary

### Completed Tasks
- ✅ **Task 10**: School Auth Context (3h) - COMPLETE

### Remaining Tasks (47 hours)
- ⏳ **Task 11**: PDF Receipt Generation (4h)
- ⏳ **Task 12**: Draft Saving (4h)
- ⏳ **Task 13**: Stripe Connect (8h)
- ⏳ **Task 14**: Google Maps (3h)
- ⏳ **Task 15**: Email Notifications (4h)
- ⏳ **Task 16**: Employee Invitations (3h)
- ⏳ **Task 17**: Search Facets (4h)
- ⏳ **Task 18**: Resend Verification (2h)
- ⏳ **Task 19**: Last Login (2h)
- ⏳ **Task 20**: Venue Navigation (2h)
- ⏳ **Task 21**: School Association (2h)
- ⏳ **Task 22**: Logging Tables (3h)
- ⏳ **Task 23**: Fix Hardcoded Values (2h) - Partially complete
- ⏳ **Task 24**: Implement TODOs (4h)

### Next Steps

1. **Immediate Priority** (8-10 hours)
   - Task 22: Create logging tables (required for other tasks)
   - Task 14: Google Maps integration (user-facing)
   - Task 20: Venue navigation (user-facing)
   - Task 21: School association (data integrity)

2. **High Priority** (16-20 hours)
   - Task 11: PDF receipts (user-facing)
   - Task 12: Draft saving (UX improvement)
   - Task 15: Email notifications (critical functionality)
   - Task 17: Search facets (UX improvement)

3. **Medium Priority** (20+ hours)
   - Task 13: Stripe Connect (complex, can be phased)
   - Task 16: Employee invitations
   - Task 18: Resend verification
   - Task 19: Last login tracking
   - Task 23: Fix remaining hardcoded values
   - Task 24: Implement remaining TODOs

### Testing Requirements

Each task should include:
- Unit tests for new utilities/services
- Integration tests for user flows
- Manual QA testing
- Error handling verification

### Deployment Strategy

1. Deploy Task 10 (School Auth Context) immediately
2. Deploy logging tables (Task 22) next
3. Deploy user-facing features in batches
4. Monitor error rates and performance
5. Rollback plan ready for each deployment

---

**Document Created:** March 2026  
**Last Updated:** March 2026  
**Status:** Task 10 Complete, 14 Tasks Remaining
