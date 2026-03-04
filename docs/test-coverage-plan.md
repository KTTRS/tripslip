# Test Coverage Plan

## Overview

This document outlines the current test coverage status, identifies uncovered critical paths, and provides a plan for improving test coverage across the TripSlip platform.

## Coverage Threshold

**Minimum Required Coverage: 70%**

The project enforces a 70% minimum coverage threshold for:
- Lines
- Statements
- Functions
- Branches

Coverage is automatically checked in CI/CD and builds will fail if coverage drops below this threshold.

## Running Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Check if coverage meets threshold
npm run check:coverage

# View detailed HTML report
open coverage/index.html
```

## Current Coverage Status

### Overall Coverage (as of last check)

| Metric     | Coverage | Status |
|------------|----------|--------|
| Lines      | TBD      | 🔄     |
| Statements | TBD      | 🔄     |
| Functions  | TBD      | 🔄     |
| Branches   | TBD      | 🔄     |

**Note:** Run `npm run test:coverage` to generate current coverage metrics.

### Package-Level Coverage

#### packages/database (High Priority)
- **Status:** ✅ Well-tested (376 tests, 100% passing)
- **Coverage:** Strong coverage of service layers
- **Focus Areas:**
  - Venue management services
  - Booking system
  - Approval workflows
  - Payment processing
  - Consent management
  - Search functionality

#### packages/auth (High Priority)
- **Status:** ✅ Good coverage
- **Coverage:** RBAC, role switching, session management
- **Focus Areas:**
  - Role-based access control
  - Multi-role user support
  - Authentication flows

#### packages/utils (Medium Priority)
- **Status:** ⚠️ Partial coverage
- **Coverage:** Some utilities tested, others need coverage
- **Focus Areas:**
  - Logger utility (tested)
  - Environment validation (tested)
  - Date/time utilities (needs coverage)
  - Validation functions (needs coverage)
  - Error handling (needs coverage)

#### packages/ui (Medium Priority)
- **Status:** ⚠️ Needs improvement
- **Coverage:** Component library needs comprehensive testing
- **Focus Areas:**
  - Radix UI component wrappers
  - Form components
  - Accessibility features
  - Responsive behavior

#### packages/i18n (Low Priority)
- **Status:** ⚠️ Minimal coverage
- **Coverage:** Translation utilities need testing
- **Focus Areas:**
  - Translation loading
  - RTL support
  - Language switching

### Application-Level Coverage

#### apps/teacher (High Priority)
- **Status:** ⚠️ Partial coverage
- **Coverage:** Some components tested, many need coverage
- **Critical Paths:**
  - Trip creation flow
  - Venue search and filtering
  - Roster management (CSV import/export)
  - Permission slip tracking
  - Trip statistics display

#### apps/parent (High Priority)
- **Status:** ⚠️ Partial coverage
- **Coverage:** Payment components tested, others need work
- **Critical Paths:**
  - Permission slip viewing and signing
  - Payment processing
  - Split payment handling
  - Add-on selection
  - Payment history

#### apps/venue (Medium Priority)
- **Status:** ⚠️ Needs improvement
- **Coverage:** Basic components tested
- **Critical Paths:**
  - Experience creation
  - Booking management
  - Employee management
  - Venue profile editing

#### apps/school (Medium Priority)
- **Status:** ⚠️ Needs improvement
- **Coverage:** Basic components tested
- **Critical Paths:**
  - Trip approval workflows
  - Teacher management
  - School trip list display
  - District administration

#### apps/landing (Low Priority)
- **Status:** ⚠️ Minimal coverage
- **Coverage:** Marketing pages, low test priority
- **Critical Paths:**
  - Contact forms
  - Pricing display
  - Feature showcase

## Uncovered Critical Paths

### High Priority (Must Cover)

1. **Teacher Trip Creation Flow**
   - File: `apps/teacher/src/components/TripCreationForm.tsx`
   - Risk: Core user journey, payment implications
   - Tests Needed: Form validation, submission, error handling

2. **Parent Payment Processing**
   - File: `apps/parent/src/components/PaymentForm.tsx`
   - Risk: Financial transactions, PCI compliance
   - Tests Needed: Payment intent creation, error handling, success flow

3. **Venue Booking Management**
   - File: `apps/venue/src/components/BookingManager.tsx`
   - Risk: Revenue impact, capacity management
   - Tests Needed: Booking acceptance/rejection, capacity updates

4. **School Approval Workflows**
   - File: `apps/school/src/components/ApprovalWorkflow.tsx`
   - Risk: Business logic, compliance
   - Tests Needed: Approval routing, delegation, status transitions

5. **Permission Slip Generation**
   - File: `packages/database/src/permission-slip-service.ts`
   - Risk: Legal compliance, parent consent
   - Tests Needed: ✅ Already well-tested with property-based tests

### Medium Priority (Should Cover)

6. **Venue Search and Filtering**
   - File: `apps/teacher/src/pages/VenueSearchPage.tsx`
   - Risk: User experience, discovery
   - Tests Needed: Search queries, filters, geographic search

7. **Student Roster Management**
   - File: `apps/teacher/src/components/RosterManager.tsx`
   - Risk: Data accuracy, FERPA compliance
   - Tests Needed: CSV import/export, student addition/removal

8. **Email Notification System**
   - File: `supabase/functions/send-email/index.ts`
   - Risk: Communication reliability
   - Tests Needed: Template rendering, retry logic, error handling

9. **SMS Notification System**
   - File: `supabase/functions/send-sms/index.ts`
   - Risk: Communication reliability, rate limiting
   - Tests Needed: Rate limiting, opt-in verification, delivery

10. **Refund Processing**
    - File: `packages/database/src/refund-service.ts`
    - Risk: Financial accuracy, customer satisfaction
    - Tests Needed: ✅ Already well-tested with property-based tests

### Low Priority (Nice to Have)

11. **UI Component Library**
    - Files: `packages/ui/src/**/*.tsx`
    - Risk: Visual consistency
    - Tests Needed: Component rendering, accessibility, props

12. **Internationalization**
    - Files: `packages/i18n/src/**/*.ts`
    - Risk: User experience for non-English users
    - Tests Needed: Translation loading, RTL support, language switching

13. **Landing Page Components**
    - Files: `apps/landing/src/components/**/*.tsx`
    - Risk: Marketing effectiveness (low technical risk)
    - Tests Needed: Form submissions, navigation

## Coverage Improvement Plan

### Phase 1: Critical Path Coverage (Week 1-2)
**Goal: Cover all high-priority critical paths**

1. Add integration tests for teacher trip creation flow
2. Add comprehensive tests for payment processing
3. Add tests for venue booking management
4. Add tests for school approval workflows
5. Verify permission slip service coverage (already strong)

**Expected Coverage Increase:** +10-15%

### Phase 2: Service Layer Coverage (Week 3-4)
**Goal: Ensure all service layers have comprehensive tests**

1. Add tests for uncovered utility functions
2. Add tests for email/SMS notification systems
3. Add tests for search and filtering logic
4. Add tests for roster management operations
5. Add property-based tests for data integrity

**Expected Coverage Increase:** +10-15%

### Phase 3: Component Coverage (Week 5-6)
**Goal: Cover UI components and user interactions**

1. Add tests for form components
2. Add tests for list/table components
3. Add tests for modal/dialog components
4. Add accessibility tests
5. Add responsive behavior tests

**Expected Coverage Increase:** +5-10%

### Phase 4: Edge Cases and Error Handling (Week 7-8)
**Goal: Cover error scenarios and edge cases**

1. Add tests for network failures
2. Add tests for validation errors
3. Add tests for permission denied scenarios
4. Add tests for concurrent operations
5. Add tests for data conflicts

**Expected Coverage Increase:** +5-10%

## Testing Best Practices

### Unit Tests
- Test individual functions and components in isolation
- Mock external dependencies (Supabase, Stripe, etc.)
- Focus on business logic and edge cases
- Use descriptive test names

### Property-Based Tests
- Use fast-check for data integrity properties
- Test invariants that should always hold
- Generate random test data to find edge cases
- Particularly useful for:
  - Payment calculations
  - Data transformations
  - Validation logic
  - State transitions

### Integration Tests
- Test complete user workflows
- Use real database connections (test environment)
- Test API integrations with mocked external services
- Focus on critical paths:
  - Trip creation → booking → payment
  - Permission slip → signature → approval
  - Venue search → experience selection → booking

### Component Tests
- Test rendering with various props
- Test user interactions (clicks, form submissions)
- Test accessibility (ARIA labels, keyboard navigation)
- Test responsive behavior
- Use React Testing Library best practices

## Coverage Monitoring

### CI/CD Integration
- Coverage is automatically checked on every PR
- Builds fail if coverage drops below 70%
- Coverage reports uploaded to Codecov
- Coverage trends tracked over time

### Local Development
```bash
# Check coverage before committing
npm run test:coverage
npm run check:coverage

# View detailed HTML report
open coverage/index.html

# Check specific package coverage
npm run test:coverage --filter=@tripslip/database
```

### Coverage Reports
- **HTML Report:** `coverage/index.html` - Detailed line-by-line coverage
- **JSON Summary:** `coverage/coverage-summary.json` - Machine-readable metrics
- **LCOV:** `coverage/lcov.info` - For Codecov integration

## Maintaining Coverage

### Adding New Features
1. Write tests alongside new code (TDD approach)
2. Ensure new code meets 70% coverage minimum
3. Add property-based tests for complex logic
4. Update this document with new critical paths

### Refactoring Code
1. Ensure tests pass before refactoring
2. Maintain or improve coverage during refactoring
3. Add tests for previously uncovered code
4. Update tests to reflect new structure

### Reviewing PRs
1. Check coverage report in PR
2. Ensure no significant coverage drops
3. Verify critical paths are tested
4. Request tests for uncovered code

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Questions or Issues?

If you have questions about test coverage or need help writing tests:
1. Review existing tests in `packages/database/src/__tests__/`
2. Check the [DATABASE_TEST_STATUS.md](../DATABASE_TEST_STATUS.md) for examples
3. Consult the development team

---

**Last Updated:** 2024-03-06  
**Next Review:** After Phase 1 completion
