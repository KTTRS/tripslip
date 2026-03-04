# @tripslip/test-utils

Comprehensive testing utilities and infrastructure for the TripSlip platform.

## Overview

This package provides a complete testing toolkit including:

- **Mock Services**: Comprehensive mocks for Supabase, Stripe, email, SMS, and storage
- **Test Fixtures**: Realistic test data for all TripSlip entities
- **Component Helpers**: Utilities for testing React components with providers
- **Database Helpers**: Tools for testing database operations and services
- **Property-Based Testing**: Arbitraries and helpers for property-based tests with fast-check
- **Authentication Helpers**: Utilities for testing auth flows and RBAC
- **Async Helpers**: Tools for testing asynchronous operations
- **DOM Helpers**: Utilities for DOM manipulation and testing
- **Assertion Helpers**: Custom matchers and assertion utilities

## Installation

This package is part of the TripSlip monorepo and is automatically available to all apps and packages.

```bash
npm install @tripslip/test-utils
```

## Quick Start

### Basic Component Testing

```typescript
import { componentHelpers, mockData } from '@tripslip/test-utils';

test('renders trip card correctly', () => {
  const trip = mockData.trip();
  const { getByText } = componentHelpers.renderComponent(
    <TripCard trip={trip} />
  );
  
  expect(getByText(trip.title)).toBeInTheDocument();
});
```

### Database Service Testing

```typescript
import { databaseHelpers, mockSupabaseResponses } from '@tripslip/test-utils';

test('creates trip successfully', async () => {
  const mockClient = databaseHelpers.createMockClient();
  const tripData = mockData.trip();
  
  databaseHelpers.mockTableOperations(mockClient, 'trips', {
    insert: mockSupabaseResponses.success([tripData]),
  });
  
  const result = await tripService.createTrip(mockClient, tripData);
  expect(result).toEqual(tripData);
});
```

### Property-Based Testing

```typescript
import { fc, arbitraries, propertyHelpers } from '@tripslip/test-utils';

test('trip capacity is always respected', () => {
  fc.assert(
    fc.property(arbitraries.trip(), (trip) => {
      expect(trip.current_participants).toBeLessThanOrEqual(trip.max_participants);
    })
  );
});
```

### Authentication Testing

```typescript
import { authHelpers, mockAuthResponses } from '@tripslip/test-utils';

test('signs in user successfully', async () => {
  const mockClient = authHelpers.createMockClient();
  const user = authHelpers.createMockUser('teacher');
  
  await authHelpers.testAuthFlow(
    signInUser,
    mockClient,
    { email: user.email, password: 'password' },
    user
  );
});
```

## Core Features

### Mock Services

Complete mocking for all external services:

```typescript
import { 
  setupStripeMocks, 
  setupEmailMocks, 
  setupSmsMocks,
  setupStorageMocks 
} from '@tripslip/test-utils';

// Mock Stripe payments
const stripe = setupStripeMocks();
simulatePaymentFlow.success();

// Mock email service
const emailService = setupEmailMocks('sendgrid');
simulateEmailSending.success();

// Mock SMS service
const smsService = setupSmsMocks();
simulateSmsSending.success();

// Mock file storage
const storage = setupStorageMocks();
simulateStorageOperations.upload.success();
```

### Test Fixtures

Realistic test data for all entities:

```typescript
import { 
  userFixtures, 
  venueFixtures, 
  tripFixtures,
  permissionSlipFixtures 
} from '@tripslip/test-utils';

const teacher = userFixtures.teacher;
const venue = venueFixtures.museum;
const trip = tripFixtures.scienceMuseumTrip;
const slip = permissionSlipFixtures.pending;
```

### Component Testing

Comprehensive component testing utilities:

```typescript
import { componentHelpers, formHelpers, interactionHelpers } from '@tripslip/test-utils';

test('permission slip form submission', async () => {
  const { user, getByRole } = componentHelpers.renderComponent(
    <PermissionSlipForm onSubmit={mockSubmit} />
  );
  
  await formHelpers.fillAndSubmitForm(user, {
    'Student Name': 'John Doe',
    'Parent Email': 'parent@example.com',
  });
  
  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      studentName: 'John Doe',
      parentEmail: 'parent@example.com',
    })
  );
});
```

### Database Testing

Tools for testing database operations:

```typescript
import { databaseHelpers, testDatabaseConfig } from '@tripslip/test-utils';

describe('Trip Service', () => {
  let client: SupabaseClient;
  
  beforeAll(async () => {
    client = await testDatabaseHooks.setupTestDatabase();
  });
  
  afterAll(async () => {
    await testDatabaseHooks.teardownTestDatabase(client);
  });
  
  test('creates trip with validation', async () => {
    const tripData = builders.trip();
    const result = await tripService.createTrip(client, tripData);
    
    businessAssertions.expectValidTrip(result);
  });
});
```

### Property-Based Testing

Comprehensive arbitraries for domain testing:

```typescript
import { fc, arbitraries, businessProperties } from '@tripslip/test-utils';

// Test business logic properties
businessProperties.tripCapacity(addStudentToTrip, arbitraries.trip(), arbitraries.user());
businessProperties.paymentCalculation(calculateTotal);
businessProperties.permissionSlipExpiration(isExpired);

// Test validation properties
validationProperties.emailValidation(validateEmail);
validationProperties.phoneValidation(validatePhone);
validationProperties.dateValidation(validateDate);

// Test security properties
securityProperties.inputSanitization(sanitizeInput);
securityProperties.accessControl(hasPermission);
```

## Advanced Usage

### Custom Test Scenarios

Create complete test scenarios:

```typescript
import { testDataManager } from '@tripslip/test-utils';

test('complete trip workflow', async () => {
  const scenario = await testDataManager.createTestScenario(client, {
    user: { email: 'teacher@test.com', password: 'password', role: 'teacher' },
    venue: { name: 'Test Science Museum' },
    trip: { title: 'Science Field Trip' },
  });
  
  // Test the complete workflow
  await testTripWorkflow(scenario.trip);
  
  // Cleanup automatically handled
  await scenario.cleanup();
});
```

### Testing Async Operations

```typescript
import { asyncHelpers, asyncPatterns } from '@tripslip/test-utils';

test('loading states', async () => {
  await asyncPatterns.testLoadingState(
    () => loadTripData(),
    () => getTripLoadingState()
  );
});

test('error handling', async () => {
  await asyncPatterns.testErrorState(
    () => loadTripData(),
    () => getTripErrorState(),
    'Failed to load trip'
  );
});
```

### Testing Accessibility

```typescript
import { a11yHelpers } from '@tripslip/test-utils';

test('keyboard navigation', async () => {
  const focusableElements = a11yHelpers.getFocusableElements();
  await a11yHelpers.testTabNavigation(focusableElements);
});

test('ARIA attributes', () => {
  const button = screen.getByRole('button');
  a11yHelpers.checkAriaAttributes(button, {
    'aria-label': 'Submit form',
    'aria-describedby': 'submit-help',
  });
});
```

## Configuration

### Environment Variables

Required for database testing:

```bash
# Test database configuration
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-test-anon-key

# Optional: Separate test database
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-test-anon-key
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['@tripslip/test-utils/setup'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
```

## Best Practices

### 1. Use Realistic Test Data

```typescript
// Good: Use fixtures for realistic data
const trip = tripFixtures.scienceMuseumTrip;

// Avoid: Minimal or unrealistic data
const trip = { id: '1', title: 'test' };
```

### 2. Test Business Logic with Properties

```typescript
// Good: Test universal properties
fc.assert(
  fc.property(arbitraries.trip(), (trip) => {
    expect(trip.current_participants).toBeLessThanOrEqual(trip.max_participants);
  })
);

// Also good: Test specific examples
test('trip capacity validation', () => {
  const trip = { ...tripFixtures.scienceMuseumTrip, max_participants: 25 };
  expect(() => addStudent(trip, 26)).toThrow('Trip is full');
});
```

### 3. Mock External Services

```typescript
// Good: Mock external services
beforeEach(() => {
  setupStripeMocks();
  setupEmailMocks();
});

// Avoid: Making real API calls in tests
```

### 4. Clean Up Test Data

```typescript
// Good: Always clean up
afterEach(async () => {
  await testDataManager.cleanupTestData(client, testIds);
});

// Good: Use test transactions
await testDatabaseHooks.withTestTransaction(client, async (client) => {
  // Test code here - cleanup is automatic
});
```

### 5. Test Error Conditions

```typescript
// Good: Test both success and failure cases
test('handles payment failure', async () => {
  simulatePaymentFlow.failure('Card declined');
  
  await expect(processPayment(paymentData)).rejects.toThrow('Card declined');
});
```

## API Reference

### Core Exports

- `mockData` - Test data generators
- `fixtures` - Realistic test fixtures
- `componentHelpers` - Component testing utilities
- `databaseHelpers` - Database testing utilities
- `authHelpers` - Authentication testing utilities
- `arbitraries` - Property-based testing arbitraries
- `assertions` - Custom assertion helpers

### Mock Services

- `setupStripeMocks()` - Mock Stripe payments
- `setupEmailMocks()` - Mock email service
- `setupSmsMocks()` - Mock SMS service
- `setupStorageMocks()` - Mock file storage
- `setupAuthMocks()` - Mock authentication

### Test Database

- `testDatabaseConfig` - Database configuration
- `testDataManager` - Test data management
- `testDatabaseHooks` - Setup/teardown hooks

## Contributing

When adding new test utilities:

1. Follow the existing patterns and naming conventions
2. Add comprehensive JSDoc documentation
3. Include usage examples in the README
4. Add tests for the test utilities themselves
5. Update the main index.ts export

## License

This package is part of the TripSlip platform and follows the same license terms.