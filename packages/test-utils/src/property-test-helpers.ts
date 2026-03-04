/**
 * Property-based testing helpers
 * Provides utilities for creating property-based tests with fast-check
 */

import { fc } from 'fast-check';

// Custom arbitraries for TripSlip domain
export const arbitraries = {
  // User data arbitraries
  email: () => fc.emailAddress(),
  
  phone: () => fc.string({ minLength: 10, maxLength: 15 }).map(s => `+1${s.replace(/\D/g, '').slice(0, 10)}`),
  
  name: () => fc.tuple(
    fc.constantFrom('John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Emma', 'Liam'),
    fc.constantFrom('Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis')
  ).map(([first, last]) => `${first} ${last}`),
  
  grade: () => fc.constantFrom('K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'),
  
  // Date and time arbitraries
  futureDate: () => fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
    .map(date => date.toISOString().split('T')[0]),
  
  pastDate: () => fc.date({ min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), max: new Date() })
    .map(date => date.toISOString().split('T')[0]),
  
  time: () => fc.tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 })
  ).map(([hours, minutes]) => 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  ),
  
  // Address arbitraries
  address: () => fc.tuple(
    fc.integer({ min: 1, max: 9999 }),
    fc.constantFrom('Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Cedar Ln', 'Maple Way'),
    fc.constantFrom('Springfield', 'Riverside', 'Franklin', 'Georgetown', 'Clinton', 'Madison'),
    fc.constantFrom('CA', 'NY', 'TX', 'FL', 'IL', 'PA'),
    fc.integer({ min: 10000, max: 99999 })
  ).map(([number, street, city, state, zip]) => 
    `${number} ${street}, ${city}, ${state} ${zip}`
  ),
  
  // Price arbitraries (in cents)
  price: () => fc.integer({ min: 100, max: 10000 }), // $1.00 to $100.00
  
  // Venue category arbitraries
  venueCategory: () => fc.constantFrom('museum', 'zoo', 'aquarium', 'park', 'theater', 'library'),
  
  venueSubcategory: () => fc.constantFrom('science', 'history', 'art', 'nature', 'wildlife', 'marine'),
  
  // Trip status arbitraries
  tripStatus: () => fc.constantFrom('draft', 'published', 'confirmed', 'completed', 'cancelled'),
  
  permissionSlipStatus: () => fc.constantFrom('pending', 'signed', 'expired'),
  
  paymentStatus: () => fc.constantFrom('pending', 'succeeded', 'failed', 'refunded'),
  
  // ID arbitraries
  id: (prefix: string = 'test') => fc.string({ minLength: 8, maxLength: 12 })
    .map(s => `${prefix}-${s}`),
  
  uuid: () => fc.uuid(),
  
  // URL arbitraries
  url: () => fc.webUrl(),
  
  // Text arbitraries
  sentence: () => fc.lorem({ maxCount: 20 }).map(words => 
    words.charAt(0).toUpperCase() + words.slice(1) + '.'
  ),
  
  paragraph: () => fc.lorem({ maxCount: 100 }).map(words => 
    words.charAt(0).toUpperCase() + words.slice(1) + '.'
  ),
  
  // File arbitraries
  fileName: () => fc.tuple(
    fc.string({ minLength: 3, maxLength: 20 }),
    fc.constantFrom('pdf', 'jpg', 'png', 'docx', 'txt')
  ).map(([name, ext]) => `${name}.${ext}`),
  
  fileSize: () => fc.integer({ min: 1024, max: 10 * 1024 * 1024 }), // 1KB to 10MB
  
  // Complex object arbitraries
  user: () => fc.record({
    id: arbitraries.id('user'),
    email: arbitraries.email(),
    name: arbitraries.name(),
    phone: arbitraries.phone(),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  }),
  
  venue: () => fc.record({
    id: arbitraries.id('venue'),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    description: arbitraries.paragraph(),
    address: arbitraries.address(),
    phone: arbitraries.phone(),
    email: arbitraries.email(),
    website: arbitraries.url(),
    category: arbitraries.venueCategory(),
    subcategory: arbitraries.venueSubcategory(),
    capacity: fc.integer({ min: 10, max: 500 }),
    status: fc.constant('active'),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  }),
  
  experience: () => fc.record({
    id: arbitraries.id('exp'),
    venue_id: arbitraries.id('venue'),
    title: fc.string({ minLength: 10, maxLength: 100 }),
    description: arbitraries.paragraph(),
    duration_minutes: fc.integer({ min: 30, max: 240 }),
    max_participants: fc.integer({ min: 10, max: 50 }),
    price_cents: arbitraries.price(),
    age_range_min: fc.integer({ min: 3, max: 12 }),
    age_range_max: fc.integer({ min: 13, max: 18 }),
    status: fc.constant('active'),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  }),
  
  trip: () => fc.record({
    id: arbitraries.id('trip'),
    title: fc.string({ minLength: 10, maxLength: 100 }),
    description: arbitraries.paragraph(),
    venue_id: arbitraries.id('venue'),
    experience_id: arbitraries.id('exp'),
    teacher_id: arbitraries.id('teacher'),
    school_id: arbitraries.id('school'),
    trip_date: arbitraries.futureDate(),
    departure_time: arbitraries.time(),
    return_time: arbitraries.time(),
    estimated_cost_cents: arbitraries.price(),
    max_participants: fc.integer({ min: 15, max: 40 }),
    grade_level: arbitraries.grade(),
    status: arbitraries.tripStatus(),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  }),
  
  permissionSlip: () => fc.record({
    id: arbitraries.id('slip'),
    trip_id: arbitraries.id('trip'),
    student_name: arbitraries.name(),
    student_grade: arbitraries.grade(),
    student_dob: arbitraries.pastDate(),
    parent_name: arbitraries.name(),
    parent_email: arbitraries.email(),
    parent_phone: arbitraries.phone(),
    emergency_contact_name: arbitraries.name(),
    emergency_contact_phone: arbitraries.phone(),
    emergency_contact_relationship: fc.constantFrom('Father', 'Mother', 'Guardian', 'Grandparent'),
    medical_conditions: fc.option(arbitraries.sentence(), { nil: '' }),
    medications: fc.option(arbitraries.sentence(), { nil: '' }),
    dietary_restrictions: fc.option(arbitraries.sentence(), { nil: '' }),
    photo_permission: fc.boolean(),
    pickup_permission: fc.boolean(),
    special_instructions: fc.option(arbitraries.sentence(), { nil: '' }),
    status: arbitraries.permissionSlipStatus(),
    magic_link_token: fc.string({ minLength: 32, maxLength: 32 }),
    magic_link_expires_at: arbitraries.futureDate(),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  }),
  
  payment: () => fc.record({
    id: arbitraries.id('payment'),
    permission_slip_id: arbitraries.id('slip'),
    stripe_payment_intent_id: fc.string({ minLength: 20, maxLength: 30 }),
    amount_cents: arbitraries.price(),
    currency: fc.constant('usd'),
    status: arbitraries.paymentStatus(),
    payment_method: fc.constantFrom('card', 'bank_transfer'),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  }),
};

// Property test helpers
export const propertyHelpers = {
  // Test that a function is pure (same input -> same output)
  testPurity: <T, R>(
    fn: (input: T) => R,
    arbitrary: fc.Arbitrary<T>,
    options: fc.Parameters<[T]> = {}
  ) => {
    fc.assert(
      fc.property(arbitrary, (input) => {
        const result1 = fn(input);
        const result2 = fn(input);
        expect(result1).toEqual(result2);
      }),
      options
    );
  },
  
  // Test that a function is idempotent (f(f(x)) = f(x))
  testIdempotency: <T>(
    fn: (input: T) => T,
    arbitrary: fc.Arbitrary<T>,
    options: fc.Parameters<[T]> = {}
  ) => {
    fc.assert(
      fc.property(arbitrary, (input) => {
        const result1 = fn(input);
        const result2 = fn(result1);
        expect(result1).toEqual(result2);
      }),
      options
    );
  },
  
  // Test that two functions are inverses
  testInverse: <T, R>(
    fn1: (input: T) => R,
    fn2: (input: R) => T,
    arbitrary: fc.Arbitrary<T>,
    options: fc.Parameters<[T]> = {}
  ) => {
    fc.assert(
      fc.property(arbitrary, (input) => {
        const result = fn2(fn1(input));
        expect(result).toEqual(input);
      }),
      options
    );
  },
  
  // Test that a function preserves a property
  testPropertyPreservation: <T>(
    fn: (input: T) => T,
    property: (input: T) => boolean,
    arbitrary: fc.Arbitrary<T>,
    options: fc.Parameters<[T]> = {}
  ) => {
    fc.assert(
      fc.property(arbitrary, (input) => {
        fc.pre(property(input)); // Only test inputs that satisfy the property
        const result = fn(input);
        expect(property(result)).toBe(true);
      }),
      options
    );
  },
  
  // Test that a function is monotonic
  testMonotonicity: <T>(
    fn: (input: T) => number,
    compare: (a: T, b: T) => number,
    arbitrary: fc.Arbitrary<T>,
    options: fc.Parameters<[T, T]> = {}
  ) => {
    fc.assert(
      fc.property(arbitrary, arbitrary, (a, b) => {
        const comparison = compare(a, b);
        if (comparison <= 0) {
          expect(fn(a)).toBeLessThanOrEqual(fn(b));
        }
      }),
      options
    );
  },
  
  // Test that a function satisfies a contract
  testContract: <T, R>(
    fn: (input: T) => R,
    precondition: (input: T) => boolean,
    postcondition: (input: T, output: R) => boolean,
    arbitrary: fc.Arbitrary<T>,
    options: fc.Parameters<[T]> = {}
  ) => {
    fc.assert(
      fc.property(arbitrary, (input) => {
        fc.pre(precondition(input));
        const output = fn(input);
        expect(postcondition(input, output)).toBe(true);
      }),
      options
    );
  },
  
  // Test error handling
  testErrorHandling: <T>(
    fn: (input: T) => any,
    shouldThrow: (input: T) => boolean,
    arbitrary: fc.Arbitrary<T>,
    options: fc.Parameters<[T]> = {}
  ) => {
    fc.assert(
      fc.property(arbitrary, (input) => {
        if (shouldThrow(input)) {
          expect(() => fn(input)).toThrow();
        } else {
          expect(() => fn(input)).not.toThrow();
        }
      }),
      options
    );
  },
  
  // Test serialization/deserialization
  testSerialization: <T>(
    serialize: (input: T) => string,
    deserialize: (input: string) => T,
    arbitrary: fc.Arbitrary<T>,
    options: fc.Parameters<[T]> = {}
  ) => {
    fc.assert(
      fc.property(arbitrary, (input) => {
        const serialized = serialize(input);
        const deserialized = deserialize(serialized);
        expect(deserialized).toEqual(input);
      }),
      options
    );
  },
};

// Validation property tests
export const validationProperties = {
  // Test email validation
  emailValidation: (validator: (email: string) => boolean) => {
    fc.assert(
      fc.property(arbitraries.email(), (email) => {
        expect(validator(email)).toBe(true);
      })
    );
    
    fc.assert(
      fc.property(fc.string().filter(s => !s.includes('@')), (invalidEmail) => {
        expect(validator(invalidEmail)).toBe(false);
      })
    );
  },
  
  // Test phone validation
  phoneValidation: (validator: (phone: string) => boolean) => {
    fc.assert(
      fc.property(arbitraries.phone(), (phone) => {
        expect(validator(phone)).toBe(true);
      })
    );
    
    fc.assert(
      fc.property(fc.string({ maxLength: 5 }), (invalidPhone) => {
        expect(validator(invalidPhone)).toBe(false);
      })
    );
  },
  
  // Test date validation
  dateValidation: (validator: (date: string) => boolean) => {
    fc.assert(
      fc.property(arbitraries.futureDate(), (date) => {
        expect(validator(date)).toBe(true);
      })
    );
    
    fc.assert(
      fc.property(fc.string().filter(s => !/^\d{4}-\d{2}-\d{2}$/.test(s)), (invalidDate) => {
        expect(validator(invalidDate)).toBe(false);
      })
    );
  },
  
  // Test price validation
  priceValidation: (validator: (price: number) => boolean) => {
    fc.assert(
      fc.property(arbitraries.price(), (price) => {
        expect(validator(price)).toBe(true);
      })
    );
    
    fc.assert(
      fc.property(fc.integer({ max: 0 }), (invalidPrice) => {
        expect(validator(invalidPrice)).toBe(false);
      })
    );
  },
};

// Business logic property tests
export const businessProperties = {
  // Test trip capacity constraints
  tripCapacity: (
    addStudentToTrip: (trip: any, student: any) => any,
    tripArbitrary: fc.Arbitrary<any>,
    studentArbitrary: fc.Arbitrary<any>
  ) => {
    fc.assert(
      fc.property(tripArbitrary, studentArbitrary, (trip, student) => {
        const updatedTrip = addStudentToTrip(trip, student);
        expect(updatedTrip.current_participants).toBeLessThanOrEqual(updatedTrip.max_participants);
      })
    );
  },
  
  // Test payment calculations
  paymentCalculation: (
    calculateTotal: (basePrice: number, addOns: number[]) => number
  ) => {
    fc.assert(
      fc.property(
        arbitraries.price(),
        fc.array(arbitraries.price(), { maxLength: 5 }),
        (basePrice, addOns) => {
          const total = calculateTotal(basePrice, addOns);
          const expectedTotal = basePrice + addOns.reduce((sum, addon) => sum + addon, 0);
          expect(total).toBe(expectedTotal);
        }
      )
    );
  },
  
  // Test permission slip expiration
  permissionSlipExpiration: (
    isExpired: (slip: any) => boolean
  ) => {
    fc.assert(
      fc.property(arbitraries.permissionSlip(), (slip) => {
        const now = new Date();
        const expirationDate = new Date(slip.magic_link_expires_at);
        const expectedExpired = expirationDate < now;
        expect(isExpired(slip)).toBe(expectedExpired);
      })
    );
  },
  
  // Test venue availability
  venueAvailability: (
    isAvailable: (venue: any, date: string, participants: number) => boolean
  ) => {
    fc.assert(
      fc.property(
        arbitraries.venue(),
        arbitraries.futureDate(),
        fc.integer({ min: 1, max: 100 }),
        (venue, date, participants) => {
          const available = isAvailable(venue, date, participants);
          if (participants > venue.capacity) {
            expect(available).toBe(false);
          }
        }
      )
    );
  },
};

// Security property tests
export const securityProperties = {
  // Test input sanitization
  inputSanitization: (sanitize: (input: string) => string) => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      '"><script>alert("xss")</script>',
    ];
    
    maliciousInputs.forEach(input => {
      const sanitized = sanitize(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onerror=');
    });
  },
  
  // Test SQL injection prevention
  sqlInjectionPrevention: (query: (input: string) => string) => {
    const sqlInjectionInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    ];
    
    sqlInjectionInputs.forEach(input => {
      const result = query(input);
      expect(result).not.toContain('DROP TABLE');
      expect(result).not.toContain('UNION SELECT');
      expect(result).not.toContain('INSERT INTO');
    });
  },
  
  // Test access control
  accessControl: (
    hasPermission: (user: any, resource: any, action: string) => boolean
  ) => {
    fc.assert(
      fc.property(
        arbitraries.user(),
        fc.record({ id: arbitraries.id(), owner_id: arbitraries.id() }),
        fc.constantFrom('read', 'write', 'delete'),
        (user, resource, action) => {
          const permission = hasPermission(user, resource, action);
          
          // Users should not have permission to resources they don't own
          if (user.id !== resource.owner_id && action === 'delete') {
            expect(permission).toBe(false);
          }
        }
      )
    );
  },
};