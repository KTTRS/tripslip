# Task 12.2: Venue Booking Property-Based Tests

## Summary

Created comprehensive property-based tests for the venue booking system using fast-check to validate two critical correctness properties:

1. **Property 31: Booking Confirmation Number Uniqueness**
2. **Property 32: Booking Status Lifecycle**

## Files Created

- `packages/database/src/__tests__/property/venue-booking.property.test.ts` (650+ lines)

## Properties Implemented

### Property 31: Booking Confirmation Number Uniqueness

**Specification**: *For any two confirmed bookings, they SHALL have different confirmation numbers.*

**Validates**: Requirements 25.3

**Test Coverage**:
1. **All booking confirmation numbers are unique** - Creates multiple bookings and verifies all confirmation numbers are unique
2. **Confirmation numbers unique across time** - Creates bookings with delays between them to ensure uniqueness even with time-based generation

**Implementation Details**:
- Generates 2-10 bookings with random student counts, chaperone counts, and prices
- Verifies each confirmation number follows the format: `VB-YYYYMMDD-XXXX`
- Uses Set data structure to verify uniqueness
- Tests run 50 iterations with fast-check

### Property 32: Booking Status Lifecycle

**Specification**: *For any booking, valid status transitions SHALL be: pending → confirmed → completed, or pending → cancelled, or confirmed → cancelled, and completed or cancelled bookings SHALL NOT transition to other states.*

**Validates**: Requirements 25.9

**Test Coverage**:
1. **Valid status transitions are allowed** - Tests all valid transition paths:
   - pending → confirmed → completed
   - pending → cancelled
   - pending → confirmed → cancelled
   - pending → confirmed → modified → completed

2. **Completed bookings cannot transition to other states** - Verifies that once a booking is completed, it cannot be cancelled or modified

3. **Cancelled bookings cannot transition to other states** - Verifies that once a booking is cancelled, it cannot be confirmed or completed

4. **Modified bookings can transition to completed or cancelled** - Verifies that modified bookings can reach terminal states

**Implementation Details**:
- Uses fast-check's `constantFrom` to generate valid status sequences
- Tests state machine transitions programmatically
- Verifies terminal states (completed, cancelled) are immutable
- Tests run 100 iterations with fast-check

## Test Structure

The tests follow the established pattern from other property-based tests in the codebase:

```typescript
describe('Property-Based Tests - Venue Booking System (Task 12.2)', () => {
  // Setup: Create test venue, experience, and trip
  beforeEach(async () => { ... });
  
  // Cleanup: Remove all test data
  afterEach(async () => { ... });
  
  // Property tests using fc.assert and fc.asyncProperty
  it('Property 31: ...', async () => {
    await fc.assert(fc.asyncProperty(...), { numRuns: 50 });
  });
});
```

## Database Requirements

**IMPORTANT**: These tests require the following database migrations to be applied:

1. `20240101000000_create_core_entities.sql` - Creates venues, experiences, trips tables
2. `20240101000030_create_venue_bookings.sql` - Creates venue_bookings table with confirmation number generation

### Current Status

The tests are **written and ready** but cannot run until the database migrations are applied to the test environment. The remote Supabase database has a migration history mismatch that needs to be resolved:

```bash
# To fix the migration history:
supabase migration repair --status reverted 20260226175022
supabase db push
```

### Running the Tests

Once migrations are applied:

```bash
cd packages/database
npm test -- venue-booking.property.test.ts --run
```

**Expected Runtime**: 3-5 minutes (property-based tests run many iterations)

## Test Configuration

- **Framework**: Vitest + fast-check
- **Iterations**: 50-100 runs per property
- **Timeout**: 180 seconds per test
- **Database**: Supabase (requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)

## Validation

These property-based tests complement the unit tests in `venue-booking-service.test.ts` by:

1. **Testing with random data** - Unit tests use fixed examples, property tests use generated data
2. **Testing invariants** - Property tests verify properties that should hold for ALL inputs
3. **Finding edge cases** - fast-check automatically finds counterexamples when properties fail

## Requirements Validated

- **Requirement 25.3**: Booking confirmation number generation and uniqueness
- **Requirement 25.9**: Booking status lifecycle and valid transitions

## Next Steps

1. **Resolve migration history** - Fix the remote database migration mismatch
2. **Apply migrations** - Run `supabase db push` to apply all pending migrations
3. **Run tests** - Execute the property-based tests to verify correctness
4. **Monitor for failures** - If fast-check finds counterexamples, fix the implementation

## Notes

- Tests use mock user IDs (UUID format) to avoid authentication rate limiting
- Each test creates its own venue, experience, and trip to ensure isolation
- Cleanup is performed in afterEach to prevent test data accumulation
- Tests are designed to be idempotent and can be run multiple times

## Related Files

- Service: `packages/database/src/venue-booking-service.ts`
- Unit Tests: `packages/database/src/__tests__/venue-booking-service.test.ts`
- Migration: `supabase/migrations/20240101000030_create_venue_bookings.sql`
- Validation: `supabase/migrations/validate_20240101000030.md`
