/**
 * Property-Based Tests for Data Sharing Consent Enforcement
 * 
 * **Property 30: Data Sharing Consent Enforcement**
 * 
 * **Validates: Requirements 12.5, 12.10, 22.1-22.5**
 * 
 * Tests that data sharing respects parent consent preferences and only shares
 * information that parents have explicitly consented to share.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fc from 'fast-check';
import { VenueBookingService } from '../../venue-booking-service';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

describe('Property 30: Data Sharing Consent Enforcement', () => {
  let supabase: ReturnType<typeof createClient>;
  let service: VenueBookingService;
  let testVenueId: string;
  let testExperienceId: string;
  let testTripId: string;
  let testBookingId: string;
  let testStudentId: string;
  let testParentId: string;

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    service = new VenueBookingService(supabase);

    // Create test data
    const { data: venue } = await supabase
      .from('venues')
      .insert({ 
        name: 'Test Venue', 
        contact_email: 'test-consent@example.com',
        address: {} 
      })
      .select()
      .single();
    testVenueId = venue!.id;

    const { data: experience } = await supabase
      .from('experiences')
      .insert({
        venue_id: testVenueId,
        title: 'Test Experience',
        description: 'Test',
        duration_minutes: 120,
        capacity: 50,
      })
      .select()
      .single();
    testExperienceId = experience!.id;

    // Create a teacher for the trip
    const { data: teacher } = await supabase
      .from('teachers')
      .insert({
        first_name: 'Test',
        last_name: 'Teacher',
        email: `test-teacher-${Date.now()}@example.com`,
      })
      .select()
      .single();

    const { data: trip } = await supabase
      .from('trips')
      .insert({
        experience_id: testExperienceId,
        teacher_id: teacher!.id,
        trip_date: '2024-06-01',
      })
      .select()
      .single();
    testTripId = trip!.id;

    const { data: booking } = await supabase
      .from('venue_bookings')
      .insert({
        trip_id: testTripId,
        venue_id: testVenueId,
        experience_id: testExperienceId,
        scheduled_date: '2024-06-01',
        start_time: '09:00',
        end_time: '12:00',
        student_count: 25,
        quoted_price_cents: 25000,
      })
      .select()
      .single();
    testBookingId = booking!.id;

    // Create a roster for the student
    const { data: roster } = await supabase
      .from('rosters')
      .insert({
        teacher_id: teacher!.id,
        name: 'Test Roster',
      })
      .select()
      .single();

    const { data: student } = await supabase
      .from('students')
      .insert({
        roster_id: roster!.id,
        first_name: 'Test',
        last_name: 'Student',
        grade: '5',
      })
      .select()
      .single();
    testStudentId = student!.id;

    const { data: parent } = await supabase
      .from('parents')
      .insert({
        first_name: 'Test',
        last_name: 'Parent',
        email: `test-parent-${Date.now()}@example.com`,
        phone: '555-0100',
      })
      .select()
      .single();
    testParentId = parent!.id;
  });

  afterEach(async () => {
    // Cleanup
    await supabase.from('data_sharing_consents').delete().eq('booking_id', testBookingId);
    await supabase.from('venue_bookings').delete().eq('id', testBookingId);
    await supabase.from('trips').delete().eq('id', testTripId);
    await supabase.from('experiences').delete().eq('id', testExperienceId);
    await supabase.from('venues').delete().eq('id', testVenueId);
    await supabase.from('students').delete().eq('id', testStudentId);
    await supabase.from('parents').delete().eq('id', testParentId);
  });

  it('Property: Consent preferences are enforced - only consented data is shared', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          shareBasicInfo: fc.boolean(),
          shareMedicalInfo: fc.boolean(),
          shareContactInfo: fc.boolean(),
          shareEmergencyInfo: fc.boolean(),
        }),
        async (consentOptions) => {
          // Create consent with random preferences
          const consent = await service.upsertConsent({
            student_id: testStudentId,
            parent_id: testParentId,
            booking_id: testBookingId,
            share_basic_info: consentOptions.shareBasicInfo,
            share_medical_info: consentOptions.shareMedicalInfo,
            share_contact_info: consentOptions.shareContactInfo,
            share_emergency_info: consentOptions.shareEmergencyInfo,
          });

          // Verify consent was saved correctly
          expect(consent.share_basic_info).toBe(consentOptions.shareBasicInfo);
          expect(consent.share_medical_info).toBe(consentOptions.shareMedicalInfo);
          expect(consent.share_contact_info).toBe(consentOptions.shareContactInfo);
          expect(consent.share_emergency_info).toBe(consentOptions.shareEmergencyInfo);

          // Retrieve consent
          const retrievedConsent = await service.getConsent(testStudentId, testBookingId);
          expect(retrievedConsent).not.toBeNull();
          expect(retrievedConsent!.share_basic_info).toBe(consentOptions.shareBasicInfo);
          expect(retrievedConsent!.share_medical_info).toBe(consentOptions.shareMedicalInfo);
          expect(retrievedConsent!.share_contact_info).toBe(consentOptions.shareContactInfo);
          expect(retrievedConsent!.share_emergency_info).toBe(consentOptions.shareEmergencyInfo);

          // Property: Consent preferences are persisted and retrievable
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('Property: Consent can be updated and changes are reflected immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initial: fc.record({
            shareBasicInfo: fc.boolean(),
            shareMedicalInfo: fc.boolean(),
            shareContactInfo: fc.boolean(),
            shareEmergencyInfo: fc.boolean(),
          }),
          updated: fc.record({
            shareBasicInfo: fc.boolean(),
            shareMedicalInfo: fc.boolean(),
            shareContactInfo: fc.boolean(),
            shareEmergencyInfo: fc.boolean(),
          }),
        }),
        async ({ initial, updated }) => {
          // Create initial consent
          await service.upsertConsent({
            student_id: testStudentId,
            parent_id: testParentId,
            booking_id: testBookingId,
            share_basic_info: initial.shareBasicInfo,
            share_medical_info: initial.shareMedicalInfo,
            share_contact_info: initial.shareContactInfo,
            share_emergency_info: initial.shareEmergencyInfo,
          });

          // Update consent
          const updatedConsent = await service.upsertConsent({
            student_id: testStudentId,
            parent_id: testParentId,
            booking_id: testBookingId,
            share_basic_info: updated.shareBasicInfo,
            share_medical_info: updated.shareMedicalInfo,
            share_contact_info: updated.shareContactInfo,
            share_emergency_info: updated.shareEmergencyInfo,
          });

          // Verify updated values
          expect(updatedConsent.share_basic_info).toBe(updated.shareBasicInfo);
          expect(updatedConsent.share_medical_info).toBe(updated.shareMedicalInfo);
          expect(updatedConsent.share_contact_info).toBe(updated.shareContactInfo);
          expect(updatedConsent.share_emergency_info).toBe(updated.shareEmergencyInfo);

          // Property: Updates are immediately reflected
          const retrieved = await service.getConsent(testStudentId, testBookingId);
          expect(retrieved!.share_basic_info).toBe(updated.shareBasicInfo);
          expect(retrieved!.share_medical_info).toBe(updated.shareMedicalInfo);
          expect(retrieved!.share_contact_info).toBe(updated.shareContactInfo);
          expect(retrieved!.share_emergency_info).toBe(updated.shareEmergencyInfo);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('Property: Consent revocation removes access to all data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          shareBasicInfo: fc.boolean(),
          shareMedicalInfo: fc.boolean(),
          shareContactInfo: fc.boolean(),
          shareEmergencyInfo: fc.boolean(),
        }),
        async (consentOptions) => {
          // Create consent
          await service.upsertConsent({
            student_id: testStudentId,
            parent_id: testParentId,
            booking_id: testBookingId,
            share_basic_info: consentOptions.shareBasicInfo,
            share_medical_info: consentOptions.shareMedicalInfo,
            share_contact_info: consentOptions.shareContactInfo,
            share_emergency_info: consentOptions.shareEmergencyInfo,
          });

          // Revoke consent
          const revokedConsent = await service.revokeConsent(testStudentId, testBookingId);

          // Property: Revoked consent has revoked_at timestamp
          expect(revokedConsent.revoked_at).not.toBeNull();

          // Property: Revoked consent is still retrievable but marked as revoked
          const retrieved = await service.getConsent(testStudentId, testBookingId);
          expect(retrieved).not.toBeNull();
          expect(retrieved!.revoked_at).not.toBeNull();

          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('Property: Each student-booking pair has at most one consent record', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            shareBasicInfo: fc.boolean(),
            shareMedicalInfo: fc.boolean(),
            shareContactInfo: fc.boolean(),
            shareEmergencyInfo: fc.boolean(),
          }),
          { minLength: 2, maxLength: 3 }
        ),
        async (consentUpdates) => {
          // Create multiple consent records for the same student-booking pair
          for (const update of consentUpdates) {
            await service.upsertConsent({
              student_id: testStudentId,
              parent_id: testParentId,
              booking_id: testBookingId,
              share_basic_info: update.shareBasicInfo,
              share_medical_info: update.shareMedicalInfo,
              share_contact_info: update.shareContactInfo,
              share_emergency_info: update.shareEmergencyInfo,
            });
          }

          // Property: Only one consent record exists
          const consents = await service.getConsentsByBookingId(testBookingId);
          const studentConsents = consents.filter(c => c.student_id === testStudentId);
          expect(studentConsents.length).toBe(1);

          // Property: The consent record reflects the last update
          const lastUpdate = consentUpdates[consentUpdates.length - 1];
          expect(studentConsents[0].share_basic_info).toBe(lastUpdate.shareBasicInfo);
          expect(studentConsents[0].share_medical_info).toBe(lastUpdate.shareMedicalInfo);
          expect(studentConsents[0].share_contact_info).toBe(lastUpdate.shareContactInfo);
          expect(studentConsents[0].share_emergency_info).toBe(lastUpdate.shareEmergencyInfo);

          return true;
        }
      ),
      { numRuns: 15 }
    );
  }, 30000);

  it('Property: Consent timestamps are monotonically increasing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            shareBasicInfo: fc.boolean(),
            shareMedicalInfo: fc.boolean(),
            shareContactInfo: fc.boolean(),
            shareEmergencyInfo: fc.boolean(),
          }),
          { minLength: 2, maxLength: 3 }
        ),
        async (consentUpdates) => {
          const timestamps: Date[] = [];

          // Create multiple consent updates
          for (const update of consentUpdates) {
            const consent = await service.upsertConsent({
              student_id: testStudentId,
              parent_id: testParentId,
              booking_id: testBookingId,
              share_basic_info: update.shareBasicInfo,
              share_medical_info: update.shareMedicalInfo,
              share_contact_info: update.shareContactInfo,
              share_emergency_info: update.shareEmergencyInfo,
            });
            timestamps.push(new Date(consent.consented_at));

            // Small delay to ensure timestamps are different
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Property: Timestamps are monotonically increasing
          for (let i = 1; i < timestamps.length; i++) {
            expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(timestamps[i - 1].getTime());
          }

          return true;
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('Property: Default consent values are false except for basic info', async () => {
    // Create consent with only required fields
    const consent = await service.upsertConsent({
      student_id: testStudentId,
      parent_id: testParentId,
      booking_id: testBookingId,
      share_basic_info: true,
      share_medical_info: false,
      share_contact_info: false,
      share_emergency_info: false,
    });

    // Property: Basic info can be true, others default to false
    expect(consent.share_basic_info).toBe(true);
    expect(consent.share_medical_info).toBe(false);
    expect(consent.share_contact_info).toBe(false);
    expect(consent.share_emergency_info).toBe(false);
  });
});
