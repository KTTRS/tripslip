/**
 * Property-Based Tests - Required Field Validation (Task 3.2)
 * 
 * Tests Property 18: Required Field Validation
 * 
 * For any entity save operation (experience, venue, booking), if any required 
 * field is missing or empty, the save SHALL be rejected with an error indicating 
 * which fields are required.
 * 
 * **Validates: Requirements 8.10, 11.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface ValidationError {
  field: string;
  message: string;
}

interface ExperienceData {
  title?: string | null;
  description?: string | null;
  duration_minutes?: number | null;
  cost_cents?: number;
  event_date?: string;
  location?: string | null;
}

interface TripRequestData {
  trip_purpose?: string | null;
  destination?: string | null;
  trip_date?: string | null;
  trip_time?: string | null;
  student_count?: number | null;
  estimated_cost_cents?: number | null;
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates experience required fields per Requirement 8.10
 * Required: title (name), description, duration_minutes
 */
function validateExperienceRequiredFields(data: ExperienceData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Requirement 8.10: Experience name is required
  if (!data.title || data.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Experience name is required',
    });
  }

  // Requirement 8.10: Experience description is required
  if (!data.description || data.description.trim() === '') {
    errors.push({
      field: 'description',
      message: 'Experience description is required',
    });
  }

  // Requirement 8.10: Experience duration is required
  if (data.duration_minutes === undefined || data.duration_minutes === null || data.duration_minutes <= 0) {
    errors.push({
      field: 'duration_minutes',
      message: 'Experience duration is required and must be positive',
    });
  }

  return errors;
}

/**
 * Validates trip request required fields per Requirement 11.2
 * Required: trip_purpose, destination, trip_date, trip_time, student_count, estimated_cost_cents
 */
function validateTripRequestRequiredFields(data: TripRequestData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Requirement 11.2: Trip purpose is required
  if (!data.trip_purpose || data.trip_purpose.trim() === '') {
    errors.push({
      field: 'trip_purpose',
      message: 'Trip purpose is required',
    });
  }

  // Requirement 11.2: Destination is required
  if (!data.destination || data.destination.trim() === '') {
    errors.push({
      field: 'destination',
      message: 'Destination is required',
    });
  }

  // Requirement 11.2: Trip date is required
  if (!data.trip_date || data.trip_date.trim() === '') {
    errors.push({
      field: 'trip_date',
      message: 'Trip date is required',
    });
  }

  // Requirement 11.2: Trip time is required
  if (!data.trip_time || data.trip_time.trim() === '') {
    errors.push({
      field: 'trip_time',
      message: 'Trip time is required',
    });
  }

  // Requirement 11.2: Student count is required
  if (data.student_count === undefined || data.student_count === null || data.student_count <= 0) {
    errors.push({
      field: 'student_count',
      message: 'Student count is required and must be positive',
    });
  }

  // Requirement 11.2: Estimated cost is required
  if (data.estimated_cost_cents === undefined || data.estimated_cost_cents === null || data.estimated_cost_cents < 0) {
    errors.push({
      field: 'estimated_cost_cents',
      message: 'Estimated cost is required and must be non-negative',
    });
  }

  return errors;
}

// =====================================================
// CUSTOM ARBITRARIES
// =====================================================

/**
 * Generates valid experience data with all required fields
 */
const validExperienceArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  description: fc.string({ minLength: 10, maxLength: 2000 }).filter(s => s.trim().length > 0),
  duration_minutes: fc.integer({ min: 1, max: 480 }), // 1 minute to 8 hours
  cost_cents: fc.integer({ min: 0, max: 100000 }),
  event_date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
    .map(d => d.toISOString().split('T')[0]),
  location: fc.string({ minLength: 5, maxLength: 200 }),
});

/**
 * Generates experience data with one or more missing required fields
 */
const invalidExperienceArbitrary = fc.oneof(
  // Missing title
  fc.record({
    title: fc.constantFrom(undefined, null, '', '   '),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    duration_minutes: fc.integer({ min: 1, max: 480 }),
  }),
  // Missing description
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.constantFrom(undefined, null, '', '   '),
    duration_minutes: fc.integer({ min: 1, max: 480 }),
  }),
  // Missing or invalid duration
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    duration_minutes: fc.constantFrom(undefined, null, 0, -1),
  }),
  // Multiple missing fields
  fc.record({
    title: fc.constantFrom(undefined, null, ''),
    description: fc.constantFrom(undefined, null, ''),
    duration_minutes: fc.constantFrom(undefined, null, 0),
  })
);

/**
 * Generates valid trip request data with all required fields
 */
const validTripRequestArbitrary = fc.record({
  trip_purpose: fc.string({ minLength: 5, maxLength: 500 }).filter(s => s.trim().length > 0),
  destination: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length > 0),
  trip_date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
    .map(d => d.toISOString().split('T')[0]),
  trip_time: fc.oneof(
    fc.constant('08:00'),
    fc.constant('09:00'),
    fc.constant('10:00'),
    fc.constant('13:00'),
    fc.constant('14:00')
  ),
  student_count: fc.integer({ min: 1, max: 200 }),
  estimated_cost_cents: fc.integer({ min: 0, max: 1000000 }),
});

/**
 * Generates trip request data with one or more missing required fields
 */
const invalidTripRequestArbitrary = fc.oneof(
  // Missing trip_purpose
  fc.record({
    trip_purpose: fc.constantFrom(undefined, null, '', '   '),
    destination: fc.string({ minLength: 3, maxLength: 200 }),
    trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
    trip_time: fc.constant('09:00'),
    student_count: fc.integer({ min: 1, max: 200 }),
    estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
  }),
  // Missing destination
  fc.record({
    trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
    destination: fc.constantFrom(undefined, null, '', '   '),
    trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
    trip_time: fc.constant('09:00'),
    student_count: fc.integer({ min: 1, max: 200 }),
    estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
  }),
  // Missing trip_date
  fc.record({
    trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
    destination: fc.string({ minLength: 3, maxLength: 200 }),
    trip_date: fc.constantFrom(undefined, null, ''),
    trip_time: fc.constant('09:00'),
    student_count: fc.integer({ min: 1, max: 200 }),
    estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
  }),
  // Missing trip_time
  fc.record({
    trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
    destination: fc.string({ minLength: 3, maxLength: 200 }),
    trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
    trip_time: fc.constantFrom(undefined, null, ''),
    student_count: fc.integer({ min: 1, max: 200 }),
    estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
  }),
  // Missing or invalid student_count
  fc.record({
    trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
    destination: fc.string({ minLength: 3, maxLength: 200 }),
    trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
    trip_time: fc.constant('09:00'),
    student_count: fc.constantFrom(undefined, null, 0, -1),
    estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
  }),
  // Missing or invalid estimated_cost_cents
  fc.record({
    trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
    destination: fc.string({ minLength: 3, maxLength: 200 }),
    trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
    trip_time: fc.constant('09:00'),
    student_count: fc.integer({ min: 1, max: 200 }),
    estimated_cost_cents: fc.constantFrom(undefined, null, -1),
  }),
  // Multiple missing fields
  fc.record({
    trip_purpose: fc.constantFrom(undefined, null, ''),
    destination: fc.constantFrom(undefined, null, ''),
    trip_date: fc.constantFrom(undefined, null, ''),
    trip_time: fc.constantFrom(undefined, null, ''),
    student_count: fc.constantFrom(undefined, null, 0),
    estimated_cost_cents: fc.constantFrom(undefined, null, -1),
  })
);

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Property 18: Required Field Validation (Task 3.2)', () => {
  describe('Experience Required Fields (Requirement 8.10)', () => {
    it('accepts experiences with all required fields (name, description, duration)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validExperienceArbitrary,
          async (experience) => {
            const errors = validateExperienceRequiredFields(experience);
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects experiences missing the title (name) field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.constantFrom(undefined, null, '', '   '),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            duration_minutes: fc.integer({ min: 1, max: 480 }),
          }),
          async (experience) => {
            const errors = validateExperienceRequiredFields(experience);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'title' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects experiences missing the description field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            description: fc.constantFrom(undefined, null, '', '   '),
            duration_minutes: fc.integer({ min: 1, max: 480 }),
          }),
          async (experience) => {
            const errors = validateExperienceRequiredFields(experience);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'description' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects experiences missing or with invalid duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            duration_minutes: fc.constantFrom(undefined, null, 0, -1, -10),
          }),
          async (experience) => {
            const errors = validateExperienceRequiredFields(experience);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'duration_minutes' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects experiences with multiple missing required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidExperienceArbitrary,
          async (experience) => {
            const errors = validateExperienceRequiredFields(experience);
            expect(errors.length).toBeGreaterThan(0);
            // Each error should have a field and message
            errors.forEach(error => {
              expect(error.field).toBeTruthy();
              expect(error.message).toBeTruthy();
              expect(error.message.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('provides specific error messages indicating which fields are missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.constant(undefined),
            description: fc.constant(undefined),
            duration_minutes: fc.constant(undefined),
          }),
          async (experience) => {
            const errors = validateExperienceRequiredFields(experience);
            
            // Should have exactly 3 errors (one for each required field)
            expect(errors).toHaveLength(3);
            
            // Check that each required field has an error
            const fields = errors.map(e => e.field);
            expect(fields).toContain('title');
            expect(fields).toContain('description');
            expect(fields).toContain('duration_minutes');
            
            // Each error should have a descriptive message
            errors.forEach(error => {
              expect(error.message).toMatch(/required/i);
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);
  });

  describe('Trip Request Required Fields (Requirement 11.2)', () => {
    it('accepts trip requests with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTripRequestArbitrary,
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects trip requests missing the trip_purpose field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            trip_purpose: fc.constantFrom(undefined, null, '', '   '),
            destination: fc.string({ minLength: 3, maxLength: 200 }),
            trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
            trip_time: fc.constant('09:00'),
            student_count: fc.integer({ min: 1, max: 200 }),
            estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
          }),
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'trip_purpose' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects trip requests missing the destination field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
            destination: fc.constantFrom(undefined, null, '', '   '),
            trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
            trip_time: fc.constant('09:00'),
            student_count: fc.integer({ min: 1, max: 200 }),
            estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
          }),
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'destination' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects trip requests missing the trip_date field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
            destination: fc.string({ minLength: 3, maxLength: 200 }),
            trip_date: fc.constantFrom(undefined, null, ''),
            trip_time: fc.constant('09:00'),
            student_count: fc.integer({ min: 1, max: 200 }),
            estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
          }),
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'trip_date' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects trip requests missing the trip_time field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
            destination: fc.string({ minLength: 3, maxLength: 200 }),
            trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
            trip_time: fc.constantFrom(undefined, null, ''),
            student_count: fc.integer({ min: 1, max: 200 }),
            estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
          }),
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'trip_time' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects trip requests missing or with invalid student_count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
            destination: fc.string({ minLength: 3, maxLength: 200 }),
            trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
            trip_time: fc.constant('09:00'),
            student_count: fc.constantFrom(undefined, null, 0, -1, -10),
            estimated_cost_cents: fc.integer({ min: 0, max: 100000 }),
          }),
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'student_count' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects trip requests missing or with invalid estimated_cost_cents', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            trip_purpose: fc.string({ minLength: 5, maxLength: 200 }),
            destination: fc.string({ minLength: 3, maxLength: 200 }),
            trip_date: fc.date().map(d => d.toISOString().split('T')[0]),
            trip_time: fc.constant('09:00'),
            student_count: fc.integer({ min: 1, max: 200 }),
            estimated_cost_cents: fc.constantFrom(undefined, null, -1, -100),
          }),
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.field === 'estimated_cost_cents' && e.message.includes('required'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects trip requests with multiple missing required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidTripRequestArbitrary,
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            expect(errors.length).toBeGreaterThan(0);
            // Each error should have a field and message
            errors.forEach(error => {
              expect(error.field).toBeTruthy();
              expect(error.message).toBeTruthy();
              expect(error.message.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('provides specific error messages indicating which fields are missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            trip_purpose: fc.constant(undefined),
            destination: fc.constant(undefined),
            trip_date: fc.constant(undefined),
            trip_time: fc.constant(undefined),
            student_count: fc.constant(undefined),
            estimated_cost_cents: fc.constant(undefined),
          }),
          async (tripRequest) => {
            const errors = validateTripRequestRequiredFields(tripRequest);
            
            // Should have exactly 6 errors (one for each required field)
            expect(errors).toHaveLength(6);
            
            // Check that each required field has an error
            const fields = errors.map(e => e.field);
            expect(fields).toContain('trip_purpose');
            expect(fields).toContain('destination');
            expect(fields).toContain('trip_date');
            expect(fields).toContain('trip_time');
            expect(fields).toContain('student_count');
            expect(fields).toContain('estimated_cost_cents');
            
            // Each error should have a descriptive message
            errors.forEach(error => {
              expect(error.message).toMatch(/required/i);
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);
  });

  describe('Cross-Entity Validation Consistency', () => {
    it('maintains consistent validation behavior across entity types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('experience', 'trip_request'),
          async (entityType) => {
            let errors: ValidationError[];

            if (entityType === 'experience') {
              // Test with all fields missing
              errors = validateExperienceRequiredFields({
                title: undefined,
                description: undefined,
                duration_minutes: undefined,
              });
              expect(errors.length).toBe(3);
            } else {
              // Test with all fields missing
              errors = validateTripRequestRequiredFields({
                trip_purpose: undefined,
                destination: undefined,
                trip_date: undefined,
                trip_time: undefined,
                student_count: undefined,
                estimated_cost_cents: undefined,
              });
              expect(errors.length).toBe(6);
            }

            // All errors should have proper structure
            errors.forEach(error => {
              expect(error).toHaveProperty('field');
              expect(error).toHaveProperty('message');
              expect(typeof error.field).toBe('string');
              expect(typeof error.message).toBe('string');
              expect(error.field.length).toBeGreaterThan(0);
              expect(error.message.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('ensures error messages are descriptive and actionable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('experience', 'trip_request'),
          async (entityType) => {
            let errors: ValidationError[];

            if (entityType === 'experience') {
              errors = validateExperienceRequiredFields({});
            } else {
              errors = validateTripRequestRequiredFields({});
            }

            // All error messages should contain the word "required"
            errors.forEach(error => {
              expect(error.message.toLowerCase()).toContain('required');
            });

            // Error messages should be unique (no duplicates)
            const messages = errors.map(e => e.message);
            const uniqueMessages = new Set(messages);
            expect(uniqueMessages.size).toBe(messages.length);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);
  });
});
