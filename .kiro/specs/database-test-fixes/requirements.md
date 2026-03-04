# Database Test Fixes - Requirements

## Overview
Fix the remaining 34 failing property-based tests in the database package to achieve 100% test pass rate (currently at 91% with 342/376 passing).

## Current Status
- **Passing**: 342 tests (91%)
- **Failing**: 34 tests (9%)
- **Total**: 376 tests

## Problem Categories

### 1. Venue Review Property Tests (3 failures)
**File**: `packages/database/src/__tests__/property/venue-review.property.test.ts`

**Failures**:
- Property 23: Venue rating is arithmetic mean of non-flagged reviews
- Property 23: Flagged reviews excluded from rating calculation  
- Property 24: Reviews for different trips are allowed

**Root Cause**: 
- Test generators creating feedback text with only whitespace (fails 50-character minimum)
- Trip creation returning null due to missing error handling
- Need to filter whitespace-only strings from generators

### 2. Search Functionality Property Tests (8 failures)
**File**: `packages/database/src/__tests__/property/search-functionality.property.test.ts`

**Failures**:
- Property 4: Text search returns only venues matching query terms
- Property 5: Geographic search returns only venues within radius
- Property 6: Multi-criteria filters use AND logic
- Property 6: Verified filter returns only verified venues
- Property 7: All search results have complete structure
- Property 8: Text search results are sorted by relevance
- Property 8: Geographic search results are sorted by distance

**Root Cause**:
- Search service not properly filtering/sorting results
- Missing or incomplete venue data in test setup
- Geographic distance calculations may be incorrect
- Need to verify search RPC functions are working correctly

### 3. Venue Booking Property Tests (10 failures)
**File**: `packages/database/src/__tests__/property/venue-booking.property.test.ts`

**Failures**:
- Property 31: All booking confirmation numbers are unique
- Property 31: Confirmation numbers unique across time
- Property 32: Valid status transitions are allowed
- Property 32: Completed bookings cannot transition to other states
- Property 32: Cancelled bookings cannot transition to other states
- Property 32: Modified bookings can transition to completed or cancelled

**Root Cause**:
- Booking service not generating unique confirmation numbers
- Status transition validation not implemented or incorrect
- Need to add state machine logic to booking service

### 4. Venue Capacity Property Tests (6 failures)
**File**: `packages/database/src/__tests__/property/venue-capacity.property.test.ts`

**Failures**:
- Property 19: Confirmed bookings reduce available capacity
- Property 19: Multiple bookings cumulatively reduce capacity
- Property 20: Cannot create bookings when capacity is zero
- Property 20: Cannot create bookings exceeding remaining capacity
- Property 20: Cancelled bookings restore capacity
- Property 19 & 20: Overlapping time slots share capacity constraints

**Root Cause**:
- Capacity tracking not implemented in booking service
- No validation preventing overbooking
- Cancellation not restoring capacity
- Need to implement capacity management logic

### 5. Venue Category Property Tests (1 failure)
**File**: `packages/database/src/__tests__/property/venue-category.property.test.ts`

**Failures**:
- Property 34: Category assignment prevents duplicate assignments

**Root Cause**:
- Missing UNIQUE constraint or validation in category assignment
- Service not checking for existing assignments before creating new ones

### 6. Consent Enforcement Property Tests (4 failures)
**File**: `packages/database/src/__tests__/property/consent-enforcement.property.test.ts`

**Failures**:
- Property: Consent preferences are enforced - only consented data is shared
- Property: Consent can be updated and changes are reflected immediately
- Property: Consent revocation removes access to all data
- Property: Each student-booking pair has at most one consent record

**Root Cause**:
- Tests timing out (5000ms timeout exceeded)
- Likely infinite loop or very slow database operations
- May need to optimize test setup or add proper cleanup

### 7. Approval Workflow Property Tests (2 failures)
**File**: `packages/database/src/__tests__/property/approval-workflow.property.test.ts`

**Failures**:
- Property 25: Trip is routed to all required approvers based on chain configuration
- Property 25: Trip routing respects cost thresholds

**Root Cause**:
- Approval routing logic not working correctly
- Chain matching by cost threshold may be incorrect
- Need to verify approval chain creation and routing logic

## Requirements

### R1: Fix Venue Review Property Tests
- R1.1: Add `.filter(s => s.trim().length > 0)` to all feedback text generators
- R1.2: Add error handling to trip creation in property tests
- R1.3: Ensure all trip creations include required `experience_id` field
- R1.4: Add proper null checks before accessing trip properties

### R2: Fix Search Functionality Property Tests
- R2.1: Verify search RPC functions are deployed and working
- R2.2: Add proper test data setup with complete venue information
- R2.3: Implement or fix text search filtering logic
- R2.4: Implement or fix geographic distance filtering
- R2.5: Implement or fix result sorting by relevance and distance
- R2.6: Add verified venue filtering logic

### R3: Fix Venue Booking Property Tests
- R3.1: Implement unique confirmation number generation
- R3.2: Add confirmation number uniqueness validation
- R3.3: Implement booking status state machine
- R3.4: Add status transition validation
- R3.5: Prevent transitions from terminal states (completed, cancelled)

### R4: Fix Venue Capacity Property Tests
- R4.1: Implement capacity tracking in booking service
- R4.2: Add capacity validation before creating bookings
- R4.3: Implement capacity reduction on booking confirmation
- R4.4: Implement capacity restoration on booking cancellation
- R4.5: Add time slot overlap detection
- R4.6: Implement shared capacity constraints for overlapping slots

### R5: Fix Venue Category Property Tests
- R5.1: Add UNIQUE constraint on (venue_id, category_id) in venue_category_assignments
- R5.2: Add duplicate check in category assignment service
- R5.3: Return appropriate error when duplicate assignment is attempted

### R6: Fix Consent Enforcement Property Tests
- R6.1: Optimize test setup to reduce execution time
- R6.2: Add proper cleanup in beforeEach/afterEach
- R6.3: Reduce number of test runs or simplify test data
- R6.4: Add timeout configuration for slow tests
- R6.5: Investigate and fix any infinite loops in consent logic

### R7: Fix Approval Workflow Property Tests
- R7.1: Verify approval chain creation logic
- R7.2: Fix cost threshold matching in chain selection
- R7.3: Ensure routing creates approval records for all chain steps
- R7.4: Add proper error handling in routing logic

## Success Criteria
- All 376 tests passing (100% pass rate)
- No tests disabled or skipped
- All fixes are proper implementations, not workarounds
- Test execution time remains reasonable (< 5 minutes total)
- No flaky tests (tests pass consistently)

## Non-Requirements
- Do not disable or skip any tests
- Do not reduce test coverage
- Do not remove property-based testing
- Do not simplify tests to make them pass artificially
