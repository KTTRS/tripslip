# TripSlip Testing Guide

This guide covers the comprehensive testing infrastructure for the TripSlip platform, including unit tests, integration tests, property-based tests, and end-to-end tests.

## Overview

The TripSlip testing infrastructure provides:

- **Unit Tests**: Component and service testing with mocks
- **Integration Tests**: Cross-service and database testing
- **Property-Based Tests**: Correctness properties with fast-check
- **End-to-End Tests**: Complete user workflow testing
- **Smoke Tests**: Critical path validation
- **Performance Tests**: Load and performance validation

## Test Infrastructure

### Test Utils Package

The `@tripslip/test-utils` package provides comprehensive testing utilities:

```typescript
import {
  // Mock services
  setupStripeMocks,
  setupEmailMocks,
  setupSmsMocks,
  
  // Test fixtures
  userFixtures,
  venueFixtures,
  tripFixtures,
  
  // Component helpers
  componentHelpers,
  formHelpers,
  
  // Database helpers
  databaseHelpers,
  testDataManager,
  
  // Property-based testing
  arbitraries,
  propertyHelpers,
  
  // Assertions
  businessAssertions,
  domAssertions,
} from '@tripslip/test-utils';
```

### Test Configuration

Global test configuration in `tests/test.config.ts`:

```typescript
export const testConfig = defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
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

## Testing Patterns

### 1. Unit Testing

#### Component Testing

```typescript
import { componentHelpers, mockData } from '@tripslip/test-utils';

describe('TripCard Component', () => {
  test('renders trip information correctly', () => {
    const trip = mockData.trip();
    const { getByText, getByTestId } = componentHelpers.renderComponent(
      <TripCard trip={trip} />
    );
    
    expect(getByText(trip.title)).toBeInTheDocument();
    expect(getByText(trip.venue.name)).toBeInTheDocument();
    expect(getByTestId('trip-date')).toHaveTextContent(trip.trip_date);
  });
  
  test('handles click events', async () => {
    const onTripClick = vi.fn();
    const trip = mockData.trip();
    
    const { user, getByRole } = componentHelpers.renderComponent(
      <TripCard trip={trip} onTripClick={onTripClick} />
    );
    
    await user.click(getByRole('button', { name: /view trip/i }));
    expect(onTripClick).toHaveBeenCalledWith(trip.id);
  });
});
```

#### Service Testing

```typescript
import { databaseHelpers, mockSupabaseResponses } from '@tripslip/test-utils';

describe('Trip Service', () => {
  let mockClient: SupabaseClient;
  
  beforeEach(() => {
    mockClient = databaseHelpers.createMockClient();
  });
  
  test('creates trip successfully', async () => {
    const tripData = mockData.trip();
    
    databaseHelpers.mockTableOperations(mockClient, 'trips', {
      insert: mockSupabaseResponses.success([tripData]),
    });
    
    const result = await tripService.createTrip(mockClient, tripData);
    
    expect(result).toEqual(tripData);
    expect(mockClient.from).toHaveBeenCalledWith('trips');
  });
  
  test('handles creation errors', async () => {
    const tripData = mockData.trip();
    
    databaseHelpers.mockTableOperations(mockClient, 'trips', {
      insert: mockSupabaseResponses.error('Validation failed'),
    });
    
    await expect(tripService.createTrip(mockClient, tripData))
      .rejects.toThrow('Validation failed');
  });
});
```

### 2. Integration Testing

#### Database Integration

```typescript
import { testDatabaseHooks, testDataManager } from '@tripslip/test-utils';

describe('Trip Workflow Integration', () => {
  let client: SupabaseClient;
  let testScenario: any;
  
  beforeAll(async () => {
    client = await testDatabaseHooks.setupTestDatabase();
  });
  
  afterAll(async () => {
    await testDatabaseHooks.teardownTestDatabase(client);
  });
  
  beforeEach(async () => {
    testScenario = await testDataManager.createTestScenario(client, {
      user: { email: 'teacher@test.com', password: 'password' },
      venue: { name: 'Test Museum' },
    });
  });
  
  afterEach(async () => {
    await testScenario.cleanup();
  });
  
  test('complete trip creation workflow', async () => {
    // Create trip
    const trip = await tripService.createTrip(client, {
      title: 'Science Field Trip',
      venue_id: testScenario.venue.id,
      experience_id: testScenario.experience.id,
      teacher_id: testScenario.user.id,
    });
    
    // Generate permission slips
    const slips = await permissionSlipService.generateSlips(client, trip.id, [
      { student_name: 'John Doe', parent_email: 'parent@test.com' },
    ]);
    
    // Verify workflow
    expect(trip).toBeDefined();
    expect(slips).toHaveLength(1);
    expect(slips[0].trip_id).toBe(trip.id);
  });
});
```

#### API Integration

```typescript
import { setupStripeMocks, mockStripeResponses } from '@tripslip/test-utils';

describe('Payment Integration', () => {
  beforeEach(() => {
    setupStripeMocks();
  });
  
  test('processes payment end-to-end', async () => {
    const paymentData = {
      amount_cents: 1500,
      permission_slip_id: 'slip-123',
    };
    
    // Mock successful payment
    mockStripe.confirmCardPayment.mockResolvedValue(
      mockStripeResponses.confirmPayment.success()
    );
    
    const result = await paymentService.processPayment(paymentData);
    
    expect(result.status).toBe('succeeded');
    expect(mockStripe.confirmCardPayment).toHaveBeenCalled();
  });
});
```

### 3. Property-Based Testing

#### Business Logic Properties

```typescript
import { fc, arbitraries, businessProperties } from '@tripslip/test-utils';

describe('Trip Business Logic Properties', () => {
  test('trip capacity is always respected', () => {
    fc.assert(
      fc.property(
        arbitraries.trip(),
        arbitraries.user(),
        (trip, student) => {
          const updatedTrip = addStudentToTrip(trip, student);
          expect(updatedTrip.current_participants)
            .toBeLessThanOrEqual(updatedTrip.max_participants);
        }
      )
    );
  });
  
  test('payment calculations are correct', () => {
    fc.assert(
      fc.property(
        arbitraries.price(),
        fc.array(arbitraries.price(), { maxLength: 5 }),
        (basePrice, addOns) => {
          const total = calculateTotalPrice(basePrice, addOns);
          const expected = basePrice + addOns.reduce((sum, addon) => sum + addon, 0);
          expect(total).toBe(expected);
        }
      )
    );
  });
  
  test('permission slip expiration logic', () => {
    fc.assert(
      fc.property(arbitraries.permissionSlip(), (slip) => {
        const now = new Date();
        const expirationDate = new Date(slip.magic_link_expires_at);
        const isExpired = checkPermissionSlipExpiration(slip);
        
        expect(isExpired).toBe(expirationDate < now);
      })
    );
  });
});
```

#### Validation Properties

```typescript
import { validationProperties } from '@tripslip/test-utils';

describe('Validation Properties', () => {
  test('email validation', () => {
    validationProperties.emailValidation(validateEmail);
  });
  
  test('phone validation', () => {
    validationProperties.phoneValidation(validatePhone);
  });
  
  test('date validation', () => {
    validationProperties.dateValidation(validateTripDate);
  });
});
```

#### Security Properties

```typescript
import { securityProperties } from '@tripslip/test-utils';

describe('Security Properties', () => {
  test('input sanitization', () => {
    securityProperties.inputSanitization(sanitizeUserInput);
  });
  
  test('access control', () => {
    securityProperties.accessControl(checkUserPermissions);
  });
  
  test('SQL injection prevention', () => {
    securityProperties.sqlInjectionPrevention(buildDatabaseQuery);
  });
});
```

### 4. End-to-End Testing

#### User Workflow Tests

```typescript
// tests/e2e/parent-workflow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Parent Permission Slip Workflow', () => {
  test('parent can sign permission slip and make payment', async ({ page }) => {
    // Navigate to permission slip
    await page.goto('/parent/permission-slip/abc123');
    
    // Fill out form
    await page.fill('[data-testid="student-name"]', 'John Doe');
    await page.fill('[data-testid="parent-email"]', 'parent@example.com');
    await page.fill('[data-testid="emergency-contact"]', 'Jane Doe');
    
    // Sign permission slip
    await page.click('[data-testid="signature-pad"]');
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(200, 150);
    await page.mouse.up();
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Verify navigation to payment
    await expect(page).toHaveURL(/\/payment/);
    
    // Fill payment form
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    // Submit payment
    await page.click('[data-testid="pay-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Payment successful');
  });
});
```

### 5. Smoke Testing

#### Critical Path Tests

```typescript
// tests/smoke/critical-endpoints.test.ts
import { describe, it, expect } from 'vitest';
import { createSupabaseClient } from '@tripslip/database';

describe('Smoke Test - Critical Endpoints', () => {
  const supabase = createSupabaseClient();
  
  it('should connect to database', async () => {
    const { data, error } = await supabase.from('venues').select('count').limit(1);
    expect(error).toBeNull();
  });
  
  it('should authenticate user', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    });
    
    expect(error).toBeNull();
    expect(data.user).toBeDefined();
  });
  
  it('should create payment intent', async () => {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_cents: 1500,
        permission_slip_id: 'test-slip-123',
      }),
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.clientSecret).toBeDefined();
  });
});
```

## Test Organization

### Directory Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── landing-workflow.test.ts
│   ├── parent-workflow.test.ts
│   ├── teacher-workflow.test.ts
│   ├── venue-workflow.test.ts
│   └── school-workflow.test.ts
├── smoke/                  # Smoke tests
│   ├── auth-flow.test.ts
│   ├── critical-endpoints.test.ts
│   ├── payment-flow.test.ts
│   └── trip-creation-flow.test.ts
├── setup.ts               # Global test setup
└── test.config.ts         # Test configuration

packages/
├── auth/src/__tests__/    # Auth package tests
├── database/src/__tests__/ # Database package tests
├── utils/src/__tests__/   # Utils package tests
└── test-utils/           # Test utilities package

apps/
├── parent/src/__tests__/  # Parent app tests
├── teacher/src/__tests__/ # Teacher app tests
├── venue/src/__tests__/   # Venue app tests
├── school/src/__tests__/  # School app tests
└── landing/src/__tests__/ # Landing app tests
```

### Test Naming Conventions

- **Unit tests**: `ComponentName.test.tsx`, `serviceName.test.ts`
- **Integration tests**: `featureName.integration.test.ts`
- **Property tests**: `businessLogic.property.test.ts`
- **E2E tests**: `userWorkflow.test.ts`
- **Smoke tests**: `criticalPath.test.ts`

## Running Tests

### Development

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run property-based tests
npm run test:property

# Run integration tests
npm run test:integration

# Run smoke tests
npm run test:smoke

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- permission-slip.test.ts

# Run tests in watch mode
npm run test:watch
```

### CI/CD Pipeline

```bash
# Run all tests with coverage
npm run test:coverage

# Run smoke tests for quick validation
npm run test:smoke

# Run E2E tests
npm run test:e2e

# Check coverage thresholds
npm run check:coverage
```

## Best Practices

### 1. Test Structure

```typescript
describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });
  
  // Happy path tests
  describe('when conditions are met', () => {
    test('should perform expected behavior', () => {
      // Test implementation
    });
  });
  
  // Error cases
  describe('when errors occur', () => {
    test('should handle error gracefully', () => {
      // Error test implementation
    });
  });
  
  // Edge cases
  describe('edge cases', () => {
    test('should handle boundary conditions', () => {
      // Edge case implementation
    });
  });
});
```

### 2. Mock Strategy

```typescript
// Good: Mock external dependencies
beforeEach(() => {
  setupStripeMocks();
  setupEmailMocks();
});

// Good: Use realistic test data
const trip = tripFixtures.scienceMuseumTrip;

// Avoid: Overmocking internal logic
// Avoid: Unrealistic test data
```

### 3. Assertion Quality

```typescript
// Good: Specific assertions
expect(result.status).toBe('succeeded');
expect(result.amount_cents).toBe(1500);

// Good: Business logic assertions
businessAssertions.expectValidTrip(trip);

// Avoid: Generic assertions
expect(result).toBeTruthy();
```

### 4. Test Data Management

```typescript
// Good: Use test fixtures
const venue = venueFixtures.museum;

// Good: Clean up test data
afterEach(async () => {
  await testDataManager.cleanupTestData(client, testIds);
});

// Good: Use test transactions
await testDatabaseHooks.withTestTransaction(client, async (client) => {
  // Test code - cleanup is automatic
});
```

### 5. Property-Based Testing

```typescript
// Good: Test universal properties
fc.assert(
  fc.property(arbitraries.trip(), (trip) => {
    // Property that should always hold
    expect(trip.current_participants).toBeLessThanOrEqual(trip.max_participants);
  })
);

// Good: Test with realistic data
fc.assert(
  fc.property(arbitraries.permissionSlip(), (slip) => {
    const isValid = validatePermissionSlip(slip);
    // Should always be valid with our arbitraries
    expect(isValid).toBe(true);
  })
);
```

## Debugging Tests

### Test Debugging

```typescript
// Debug component rendering
import { debug } from '@tripslip/test-utils';

test('debug component', () => {
  const { container } = render(<Component />);
  debug.logElement(container.firstChild);
});

// Debug mock calls
test('debug mocks', () => {
  debug.logMockCalls(mockFunction);
});
```

### Performance Testing

```typescript
import { performance } from '@tripslip/test-utils';

test('component renders quickly', async () => {
  const duration = await performance.measureRenderTime(() => {
    render(<ExpensiveComponent />);
  });
  
  performance.expectFastRender(duration, 100); // < 100ms
});
```

## Coverage Requirements

- **Minimum Coverage**: 70% for lines, functions, branches, statements
- **Critical Paths**: 90%+ coverage required
- **New Features**: Must include comprehensive tests
- **Bug Fixes**: Must include regression tests

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run smoke tests
        run: npm run test:smoke
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run property-based tests
        run: npm run test:property
      
      - name: Check coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

This comprehensive testing infrastructure ensures the TripSlip platform maintains high quality and reliability across all components and user workflows.