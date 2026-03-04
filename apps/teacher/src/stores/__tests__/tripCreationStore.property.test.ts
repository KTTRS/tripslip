/**
 * Property-Based Tests - Trip Pre-Population from Venue (Task 13.2)
 * 
 * Tests Property 29: Trip Pre-Population from Venue
 * 
 * **Validates: Requirements 11.4, 14.1, 14.2, 14.4**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useTripCreationStore, type VenueInfo, type VenueForm } from '../tripCreationStore';

// Arbitraries for generating test data
const venueInfoArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 100 }),
  address: fc.record({
    street: fc.string({ minLength: 5, maxLength: 100 }),
    city: fc.string({ minLength: 3, maxLength: 50 }),
    state: fc.string({ minLength: 2, maxLength: 2 }),
    zipCode: fc.string({ minLength: 5, maxLength: 10 }),
  }),
  contact_email: fc.emailAddress(),
  contact_phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
  website: fc.option(fc.webUrl(), { nil: null }),
});

const experienceArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 3, maxLength: 200 }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 1000 }), { nil: null }),
  event_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
  event_time: fc.option(fc.string({ minLength: 5, maxLength: 8 }), { nil: null }),
  cost_cents: fc.integer({ min: 0, max: 100000 }),
  location: fc.string({ minLength: 3, maxLength: 100 }),
  created_at: fc.date().map(d => d.toISOString()),
  donation_message: fc.constant(null),
  indemnification: fc.constant(null),
  payment_description: fc.constant(null),
});

const venueFormArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 100 }),
  category: fc.constantFrom('permission_slip', 'waiver', 'medical', 'photo_release'),
  file_url: fc.webUrl(),
  required: fc.boolean(),
});

describe('Property-Based Tests - Trip Pre-Population from Venue (Task 13.2)', () => {
  beforeEach(() => {
    // Reset store before each test
    useTripCreationStore.getState().reset();
  });

  /**
   * Property 29: Trip Pre-Population from Venue
   * 
   * For any trip created from a venue listing, the trip SHALL be pre-populated 
   * with the venue ID, experience ID, venue name, address, and associated forms 
   * from the selected venue and experience.
   * 
   * **Validates: Requirements 11.4, 14.1, 14.2, 14.4**
   */
  it('Property 29: Trip is pre-populated with venue ID from venue listing', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: Venue ID should be set
          expect(state.venueInfo).not.toBeNull();
          expect(state.venueInfo?.id).toBe(venueInfo.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Trip is pre-populated with experience ID from venue listing', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: Experience ID should be set
          expect(state.selectedExperience).not.toBeNull();
          expect(state.selectedExperience?.id).toBe(experience.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Trip is pre-populated with venue name in trip title', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: Trip name should contain venue name and experience title
          expect(state.tripDetails).not.toBeNull();
          expect(state.tripDetails?.name).toContain(venueInfo.name);
          expect(state.tripDetails?.name).toContain(experience.title);
          expect(state.tripDetails?.name).toBe(`${venueInfo.name} - ${experience.title}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Trip is pre-populated with venue address', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: Venue address should be preserved
          expect(state.venueInfo).not.toBeNull();
          expect(state.venueInfo?.address).toEqual(venueInfo.address);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Trip is pre-populated with associated venue forms', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 1, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: All venue forms should be included
          expect(state.venueForms).toHaveLength(forms.length);
          expect(state.venueForms).toEqual(forms);

          // Property: Each form should have all required fields
          for (let i = 0; i < forms.length; i++) {
            expect(state.venueForms[i].id).toBe(forms[i].id);
            expect(state.venueForms[i].name).toBe(forms[i].name);
            expect(state.venueForms[i].category).toBe(forms[i].category);
            expect(state.venueForms[i].file_url).toBe(forms[i].file_url);
            expect(state.venueForms[i].required).toBe(forms[i].required);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Trip description is pre-populated from experience description', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: Trip description should match experience description (or be empty if null)
          expect(state.tripDetails).not.toBeNull();
          if (experience.description) {
            expect(state.tripDetails?.description).toBe(experience.description);
          } else {
            expect(state.tripDetails?.description).toBe('');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Trip time is pre-populated from experience time', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: Trip time should match experience time (or be empty if null)
          expect(state.tripDetails).not.toBeNull();
          if (experience.event_time) {
            expect(state.tripDetails?.time).toBe(experience.event_time);
          } else {
            expect(state.tripDetails?.time).toBe('');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Pre-population preserves all venue contact information', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: All venue contact information should be preserved
          expect(state.venueInfo).not.toBeNull();
          expect(state.venueInfo?.contact_email).toBe(venueInfo.contact_email);
          expect(state.venueInfo?.contact_phone).toBe(venueInfo.contact_phone);
          expect(state.venueInfo?.website).toBe(venueInfo.website);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Pre-population initializes special requirements as empty', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: Special requirements should be initialized as empty string
          expect(state.tripDetails).not.toBeNull();
          expect(state.tripDetails?.specialRequirements).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Pre-population works with empty forms array', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        (venueInfo, experience) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate from venue with empty forms array
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, []);

          const state = useTripCreationStore.getState();

          // Property: Should still pre-populate venue and experience info
          expect(state.venueInfo).not.toBeNull();
          expect(state.venueInfo?.id).toBe(venueInfo.id);
          expect(state.selectedExperience).not.toBeNull();
          expect(state.selectedExperience?.id).toBe(experience.id);
          expect(state.venueForms).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Pre-population is idempotent for same venue/experience', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        (venueInfo, experience, forms) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Pre-populate twice with same data
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);
          const firstState = useTripCreationStore.getState();

          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);
          const secondState = useTripCreationStore.getState();

          // Property: State should be identical after second pre-population
          expect(secondState.venueInfo).toEqual(firstState.venueInfo);
          expect(secondState.selectedExperience).toEqual(firstState.selectedExperience);
          expect(secondState.venueForms).toEqual(firstState.venueForms);
          expect(secondState.tripDetails).toEqual(firstState.tripDetails);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 29: Pre-population does not affect other store state', () => {
    fc.assert(
      fc.property(
        venueInfoArbitrary,
        experienceArbitrary,
        fc.array(venueFormArbitrary, { minLength: 0, maxLength: 5 }),
        fc.integer({ min: 1, max: 4 }),
        (venueInfo, experience, forms, step) => {
          // Reset store for each iteration
          useTripCreationStore.getState().reset();

          // Set some other state
          useTripCreationStore.getState().setCurrentStep(step);

          // Pre-populate from venue
          useTripCreationStore.getState().prePopulateFromVenue(venueInfo, experience, forms);

          const state = useTripCreationStore.getState();

          // Property: Other state should not be affected
          expect(state.currentStep).toBe(step);
          expect(state.isDraft).toBe(false);
          expect(state.draftId).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
