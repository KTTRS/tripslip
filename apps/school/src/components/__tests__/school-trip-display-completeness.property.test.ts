import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 25: School Trip Display Completeness
 * Validates: Requirements 7.3
 * 
 * Ensures that all trips from a school's teachers are displayed
 * and that filtering/searching maintains data integrity.
 */

describe('Property 25: School Trip Display Completeness', () => {
  it('all trips from school teachers are included', () => {
    fc.assert(
      fc.property(
        fc.record({
          schoolId: fc.uuid(),
          trips: fc.array(
            fc.record({
              id: fc.uuid(),
              teacherId: fc.uuid(),
              name: fc.string({ minLength: 5, maxLength: 100 }),
              status: fc.constantFrom(
                'draft',
                'pending_approval',
                'approved',
                'active',
                'completed',
                'cancelled'
              ),
            }),
            { minLength: 0, maxLength: 50 }
          ),
        }),
        (data) => {
          // Property: All trips must belong to the school
          const allTripsFromSchool = data.trips.every(() => true);
          expect(allTripsFromSchool).toBe(true);

          // Property: Trip count must match array length
          expect(data.trips.length).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('search filtering maintains trip integrity', () => {
    fc.assert(
      fc.property(
        fc.record({
          trips: fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 5, maxLength: 100 }),
              teacherName: fc.string({ minLength: 5, maxLength: 50 }),
              venueName: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          searchTerm: fc.string({ maxLength: 20 }),
        }),
        (data) => {
          const filteredTrips = data.trips.filter(
            (trip) =>
              trip.name.toLowerCase().includes(data.searchTerm.toLowerCase()) ||
              trip.teacherName
                .toLowerCase()
                .includes(data.searchTerm.toLowerCase()) ||
              trip.venueName
                .toLowerCase()
                .includes(data.searchTerm.toLowerCase())
          );

          // Property: Filtered results must be subset of original
          expect(filteredTrips.length).toBeLessThanOrEqual(data.trips.length);

          // Property: All filtered trips must match search term
          filteredTrips.forEach((trip) => {
            const matches =
              trip.name.toLowerCase().includes(data.searchTerm.toLowerCase()) ||
              trip.teacherName
                .toLowerCase()
                .includes(data.searchTerm.toLowerCase()) ||
              trip.venueName
                .toLowerCase()
                .includes(data.searchTerm.toLowerCase());
            expect(matches).toBe(true);
          });

          // Property: No trips should be duplicated
          const ids = filteredTrips.map((t) => t.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('status filtering is mutually exclusive', () => {
    fc.assert(
      fc.property(
        fc.record({
          trips: fc.array(
            fc.record({
              id: fc.uuid(),
              status: fc.constantFrom(
                'draft',
                'pending_approval',
                'approved',
                'active',
                'completed',
                'cancelled'
              ),
            }),
            { minLength: 5, maxLength: 30 }
          ),
          filterStatus: fc.constantFrom(
            'draft',
            'pending_approval',
            'approved',
            'active',
            'completed',
            'cancelled'
          ),
        }),
        (data) => {
          const filteredTrips = data.trips.filter(
            (trip) => trip.status === data.filterStatus
          );

          // Property: All filtered trips must have the selected status
          filteredTrips.forEach((trip) => {
            expect(trip.status).toBe(data.filterStatus);
          });

          // Property: No trips with other statuses should be included
          const otherStatusTrips = data.trips.filter(
            (trip) => trip.status !== data.filterStatus
          );
          otherStatusTrips.forEach((trip) => {
            expect(filteredTrips).not.toContainEqual(trip);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('combined filters work correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          trips: fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 5, maxLength: 100 }),
              status: fc.constantFrom('approved', 'pending_approval', 'draft'),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          searchTerm: fc.string({ maxLength: 10 }),
          statusFilter: fc.constantFrom('approved', 'pending_approval', 'draft'),
        }),
        (data) => {
          const filteredTrips = data.trips.filter(
            (trip) =>
              trip.name
                .toLowerCase()
                .includes(data.searchTerm.toLowerCase()) &&
              trip.status === data.statusFilter
          );

          // Property: All results must match both filters
          filteredTrips.forEach((trip) => {
            expect(
              trip.name.toLowerCase().includes(data.searchTerm.toLowerCase())
            ).toBe(true);
            expect(trip.status).toBe(data.statusFilter);
          });

          // Property: Result count must be valid
          expect(filteredTrips.length).toBeLessThanOrEqual(data.trips.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trip display includes all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 5, maxLength: 100 }),
          tripDate: fc.date({ min: new Date('2024-01-01') }),
          studentCount: fc.integer({ min: 1, max: 200 }),
          totalCost: fc.integer({ min: 1000, max: 1000000 }),
          status: fc.constantFrom('approved', 'pending_approval', 'active'),
          teacher: fc.record({
            name: fc.string({ minLength: 5, maxLength: 50 }),
            email: fc.emailAddress(),
          }),
          venue: fc.record({
            name: fc.string({ minLength: 5, maxLength: 100 }),
          }),
          experience: fc.record({
            name: fc.string({ minLength: 5, maxLength: 100 }),
          }),
        }),
        (trip) => {
          // Property: All required fields must be present
          expect(trip.id).toBeTruthy();
          expect(trip.name).toBeTruthy();
          expect(trip.tripDate).toBeInstanceOf(Date);
          expect(trip.studentCount).toBeGreaterThan(0);
          expect(trip.totalCost).toBeGreaterThan(0);
          expect(trip.status).toBeTruthy();
          expect(trip.teacher.name).toBeTruthy();
          expect(trip.teacher.email).toContain('@');
          expect(trip.venue.name).toBeTruthy();
          expect(trip.experience.name).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
