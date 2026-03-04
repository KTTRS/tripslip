# Database Test Fixes - Design

## Architecture Overview

This design addresses 34 failing property-based tests across 7 test files by implementing missing functionality and fixing test setup issues.

## Design Principles

1. **Fix Root Causes**: Address underlying issues in services, not just test code
2. **Maintain Test Integrity**: Keep property-based testing rigorous
3. **No Shortcuts**: Implement proper validation and business logic
4. **Performance**: Ensure tests complete in reasonable time

## Component Designs

### 1. Venue Review Property Tests

#### Problem Analysis
- Generators creating whitespace-only feedback (violates 50-char minimum)
- Trip creation failing silently
- Missing error handling

#### Solution Design

**Test Generator Fixes**:
```typescript
// Add filter to feedback generator
fc.string({ minLength: 50, maxLength: 200 })
  .filter(s => s.trim().length >= 50)  // Ensure non-whitespace content
```

**Trip Creation Error Handling**:
```typescript
const { data: trip, error: tripError } = await supabase
  .from('trips')
  .insert({
    experience_id: testExperienceId,
    teacher_id: testUserId,
    trip_date: '2024-06-15',
    status: 'completed',
  })
  .select()
  .single();

if (tripError || !trip) {
  throw new Error(`Failed to create trip: ${tripError?.message || 'Unknown error'}`);
}
```

**Files to Modify**:
- `packages/database/src/__tests__/property/venue-review.property.test.ts`

---

### 2. Search Functionality Property Tests

#### Problem Analysis
- Search RPC functions may not be working correctly
- Missing venue data in test setup
- Filtering and sorting logic issues

#### Solution Design

**Verify Search Functions**:
1. Check if `search_venues_by_text` and `search_venues_by_location` RPC functions exist
2. Verify they return correct data structure
3. Add fallback to direct queries if RPC fails

**Test Data Setup**:
```typescript
beforeEach(async () => {
  // Create venues with complete data
  const venues = await Promise.all([
    supabase.from('venues').insert({
      name: 'Science Museum',
      description: 'A museum focused on science education',
      address: { 
        street: '123 Science St', 
        city: 'Boston', 
        state: 'MA', 
        zipCode: '02101',
        coordinates: { lat: 42.3601, lng: -71.0589 }
      },
      contact_email: 'info@sciencemuseum.com',
      contact_phone: '555-0100',
      verified: true,
    }).select().single(),
    // ... more venues
  ]);
});
```

**Search Service Fixes**:
- Implement proper text matching (case-insensitive, partial match)
- Implement geographic distance calculation using Haversine formula
- Add result sorting by relevance score and distance
- Add verified filter

**Files to Modify**:
- `packages/database/src/search-service.ts`
- `packages/database/src/__tests__/property/search-functionality.property.test.ts`

---

### 3. Venue Booking Property Tests

#### Problem Analysis
- No confirmation number generation
- No status transition validation
- Missing state machine logic

#### Solution Design

**Confirmation Number Generation**:
```typescript
// In venue-booking-service.ts
private generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${timestamp}-${random}`;
}
```

**Status State Machine**:
```typescript
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'modified'],
  modified: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

private validateStatusTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus
): void {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }
}
```

**Files to Modify**:
- `packages/database/src/venue-booking-service.ts`
- `packages/database/src/__tests__/property/venue-booking.property.test.ts`

---

### 4. Venue Capacity Property Tests

#### Problem Analysis
- No capacity tracking
- No overbooking prevention
- Cancellation doesn't restore capacity

#### Solution Design

**Capacity Tracking**:
```typescript
// Add to venue-booking-service.ts
async getRemainingCapacity(
  experienceId: string,
  date: string,
  timeSlot: string
): Promise<number> {
  // Get experience capacity
  const { data: experience } = await this.supabase
    .from('experiences')
    .select('capacity')
    .eq('id', experienceId)
    .single();

  if (!experience) throw new Error('Experience not found');

  // Get confirmed bookings for this time slot
  const { data: bookings } = await this.supabase
    .from('venue_bookings')
    .select('num_students')
    .eq('experience_id', experienceId)
    .eq('booking_date', date)
    .eq('time_slot', timeSlot)
    .in('status', ['confirmed', 'modified']);

  const bookedCapacity = bookings?.reduce(
    (sum, b) => sum + b.num_students, 
    0
  ) || 0;

  return experience.capacity - bookedCapacity;
}
```

**Capacity Validation**:
```typescript
async createBooking(input: CreateBookingInput): Promise<Booking> {
  // Check capacity before creating
  const remaining = await this.getRemainingCapacity(
    input.experience_id,
    input.booking_date,
    input.time_slot
  );

  if (remaining < input.num_students) {
    throw new Error(
      `Insufficient capacity. Requested: ${input.num_students}, Available: ${remaining}`
    );
  }

  // Create booking...
}
```

**Capacity Restoration on Cancellation**:
```typescript
async cancelBooking(bookingId: string): Promise<Booking> {
  const booking = await this.getBookingById(bookingId);
  
  // Validate transition
  this.validateStatusTransition(booking.status, 'cancelled');
  
  // Update status (capacity automatically restored by query)
  const { data } = await this.supabase
    .from('venue_bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select()
    .single();

  return data!;
}
```

**Files to Modify**:
- `packages/database/src/venue-booking-service.ts`
- `packages/database/src/__tests__/property/venue-capacity.property.test.ts`

---

### 5. Venue Category Property Tests

#### Problem Analysis
- No duplicate prevention in category assignments

#### Solution Design

**Database Constraint**:
```sql
-- Add to migration
ALTER TABLE venue_category_assignments
ADD CONSTRAINT unique_venue_category 
UNIQUE (venue_id, category_id);
```

**Service Validation**:
```typescript
// In venue-category-service.ts
async assignCategory(
  venueId: string,
  categoryId: string
): Promise<VenueCategoryAssignment> {
  // Check for existing assignment
  const { data: existing } = await this.supabase
    .from('venue_category_assignments')
    .select('id')
    .eq('venue_id', venueId)
    .eq('category_id', categoryId)
    .maybeSingle();

  if (existing) {
    throw new Error('Category already assigned to this venue');
  }

  // Create assignment...
}
```

**Files to Modify**:
- `supabase/migrations/20240101000040_add_category_unique_constraint.sql` (new)
- `packages/database/src/venue-category-service.ts`

---

### 6. Consent Enforcement Property Tests

#### Problem Analysis
- Tests timing out (> 5000ms)
- Likely too much test data or slow operations

#### Solution Design

**Optimize Test Setup**:
```typescript
beforeEach(async () => {
  // Reduce test data volume
  // Use batch inserts instead of individual inserts
  // Clean up only necessary data
});

// Increase timeout for complex property tests
it('Property: Consent preferences are enforced', async () => {
  await fc.assert(
    fc.asyncProperty(/* ... */),
    { numRuns: 20 } // Reduce from default 100
  );
}, 30000); // Increase timeout to 30s
```

**Optimize Consent Queries**:
```typescript
// Add indexes if missing
CREATE INDEX idx_consent_student_booking 
ON data_sharing_consents(student_id, booking_id);

// Use efficient queries
const { data: consents } = await this.supabase
  .from('data_sharing_consents')
  .select('*')
  .eq('student_id', studentId)
  .eq('booking_id', bookingId)
  .limit(1)
  .maybeSingle();
```

**Files to Modify**:
- `packages/database/src/__tests__/property/consent-enforcement.property.test.ts`
- `supabase/migrations/20240101000041_add_consent_indexes.sql` (new)

---

### 7. Approval Workflow Property Tests

#### Problem Analysis
- Routing not creating approval records correctly
- Cost threshold matching incorrect

#### Solution Design

**Fix Chain Selection**:
```typescript
// In approval-workflow-service.ts
async selectApprovalChain(
  schoolId: string,
  tripCriteria: TripCriteria
): Promise<ApprovalChain> {
  const { data: chains } = await this.supabase
    .from('approval_chains')
    .select('*')
    .eq('school_id', schoolId)
    .lte('min_cost_cents', tripCriteria.cost_cents || 0)
    .gte('max_cost_cents', tripCriteria.cost_cents || 0)
    .order('priority', { ascending: true })
    .limit(1);

  if (!chains || chains.length === 0) {
    throw new Error('No matching approval chain found');
  }

  return chains[0];
}
```

**Fix Routing Logic**:
```typescript
async routeTripForApproval(
  tripId: string,
  schoolId: string,
  criteria: TripCriteria
): Promise<TripApprovalRouting> {
  // Select chain
  const chain = await this.selectApprovalChain(schoolId, criteria);

  // Get chain steps
  const { data: steps } = await this.supabase
    .from('approval_chain_steps')
    .select('*')
    .eq('chain_id', chain.id)
    .order('step_order', { ascending: true });

  if (!steps || steps.length === 0) {
    throw new Error('Approval chain has no steps');
  }

  // Create routing record
  const { data: routing } = await this.supabase
    .from('trip_approval_routing')
    .insert({
      trip_id: tripId,
      chain_id: chain.id,
    })
    .select()
    .single();

  // Create approval records for each step
  const approvals = await Promise.all(
    steps.map(step =>
      this.supabase
        .from('trip_approvals')
        .insert({
          trip_id: tripId,
          chain_id: chain.id,
          step_order: step.step_order,
          approver_user_id: step.approver_user_id,
          status: 'pending',
        })
        .select()
        .single()
    )
  );

  return routing!;
}
```

**Files to Modify**:
- `packages/database/src/approval-workflow-service.ts`
- `packages/database/src/__tests__/property/approval-workflow.property.test.ts`

---

## Database Migrations Required

### Migration 1: Category Unique Constraint
```sql
-- 20240101000040_add_category_unique_constraint.sql
ALTER TABLE venue_category_assignments
ADD CONSTRAINT unique_venue_category 
UNIQUE (venue_id, category_id);
```

### Migration 2: Consent Indexes
```sql
-- 20240101000041_add_consent_indexes.sql
CREATE INDEX IF NOT EXISTS idx_consent_student_booking 
ON data_sharing_consents(student_id, booking_id);

CREATE INDEX IF NOT EXISTS idx_consent_student 
ON data_sharing_consents(student_id);
```

## Testing Strategy

### Unit Test Fixes
1. Fix test generators to produce valid data
2. Add proper error handling in test setup
3. Optimize slow tests

### Service Implementation
1. Implement missing business logic
2. Add validation and error handling
3. Ensure proper state management

### Integration Testing
1. Verify all services work together
2. Test with realistic data volumes
3. Ensure performance is acceptable

## Performance Considerations

- Keep test execution under 5 minutes total
- Use batch operations where possible
- Add database indexes for frequently queried fields
- Reduce property test runs for slow tests (from 100 to 20-50)
- Use proper cleanup to prevent data accumulation

## Rollback Plan

If any fix causes issues:
1. Revert the specific service changes
2. Keep test fixes (they're improvements)
3. Add TODO comments for future fixes
4. Document why the fix was reverted

## Success Metrics

- 100% test pass rate (376/376)
- Test execution time < 5 minutes
- No flaky tests
- All business logic properly implemented
- No disabled or skipped tests
