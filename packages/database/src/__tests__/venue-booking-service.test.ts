/**
 * Unit tests for Venue Booking Service
 * 
 * Tests booking creation, status management, and consent handling.
 * Requirements: 11.1, 11.3, 12.1, 12.2, 12.3, 12.4, 12.5, 25.1, 25.2, 25.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VenueBookingService } from '../venue-booking-service';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  return mockClient;
};

describe('VenueBookingService', () => {
  let service: VenueBookingService;
  let mockClient: SupabaseClient;
  let mockFrom: any;
  let mockSelect: any;
  let mockInsert: any;
  let mockUpdate: any;
  let mockEq: any;
  let mockSingle: any;
  let mockOrder: any;
  let mockGte: any;
  let mockLte: any;
  let mockIs: any;
  let mockUpsert: any;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    service = new VenueBookingService(mockClient);

    // Setup mock chain
    mockSingle = vi.fn();
    mockOrder = vi.fn(() => ({ data: [], error: null }));
    mockGte = vi.fn(() => ({ lte: mockLte, order: mockOrder, data: [], error: null }));
    mockLte = vi.fn(() => ({ order: mockOrder, data: [], error: null }));
    mockIs = vi.fn(() => ({ data: [], error: null }));
    mockEq = vi.fn(() => ({
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
      is: mockIs,
      gte: mockGte,
      lte: mockLte,
      select: mockSelect,
      data: [],
      error: null,
    }));
    mockSelect = vi.fn(() => ({
      single: mockSingle,
      eq: mockEq,
      order: mockOrder,
      data: [],
      error: null,
    }));
    mockInsert = vi.fn(() => ({
      select: mockSelect,
    }));
    mockUpdate = vi.fn(() => ({
      eq: mockEq,
    }));
    mockUpsert = vi.fn(() => ({
      select: mockSelect,
    }));
    mockFrom = vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      upsert: mockUpsert,
      eq: mockEq,
    }));

    (mockClient.from as any) = mockFrom;

    // Mock checkAvailability to always return available
    vi.spyOn(service, 'checkAvailability').mockResolvedValue({
      available: true,
      remainingCapacity: 100,
    });
  });

  describe('createBooking', () => {
    it('should create a new booking with required fields', async () => {
      const mockBooking = {
        id: 'booking-123',
        trip_id: 'trip-123',
        venue_id: 'venue-123',
        experience_id: 'exp-123',
        scheduled_date: '2024-06-15',
        start_time: '09:00:00',
        end_time: '15:00:00',
        student_count: 25,
        chaperone_count: 3,
        status: 'pending',
        confirmation_number: 'VB-20240315-A1B2',
        quoted_price_cents: 5000,
        deposit_cents: null,
        paid_cents: 0,
        special_requirements: null,
        venue_notes: null,
        internal_notes: null,
        requested_at: '2024-03-15T10:00:00Z',
        confirmed_at: null,
        cancelled_at: null,
        completed_at: null,
        created_at: '2024-03-15T10:00:00Z',
        updated_at: '2024-03-15T10:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockBooking, error: null });

      const input = {
        trip_id: 'trip-123',
        venue_id: 'venue-123',
        experience_id: 'exp-123',
        scheduled_date: '2024-06-15',
        start_time: '09:00:00',
        end_time: '15:00:00',
        student_count: 25,
        chaperone_count: 3,
        quoted_price_cents: 5000,
      };

      const result = await service.createBooking(input);

      expect(mockFrom).toHaveBeenCalledWith('venue_bookings');
      expect(mockInsert).toHaveBeenCalledWith({
        trip_id: input.trip_id,
        venue_id: input.venue_id,
        experience_id: input.experience_id,
        scheduled_date: input.scheduled_date,
        start_time: input.start_time,
        end_time: input.end_time,
        student_count: input.student_count,
        chaperone_count: input.chaperone_count,
        quoted_price_cents: input.quoted_price_cents,
        deposit_cents: null,
        special_requirements: null,
        confirmation_number: expect.any(String),
        status: 'pending',
      });
      expect(result).toEqual(mockBooking);
      expect(result.status).toBe('pending');
      expect(result.confirmation_number).toMatch(/^VB-\d{8}-[A-Z0-9]{4}$/);
    });

    it('should create booking with optional fields', async () => {
      const mockBooking = {
        id: 'booking-123',
        deposit_cents: 1000,
        special_requirements: 'Wheelchair accessible',
      };

      mockSingle.mockResolvedValue({ data: mockBooking, error: null });

      const input = {
        trip_id: 'trip-123',
        venue_id: 'venue-123',
        experience_id: 'exp-123',
        scheduled_date: '2024-06-15',
        start_time: '09:00:00',
        end_time: '15:00:00',
        student_count: 25,
        quoted_price_cents: 5000,
        deposit_cents: 1000,
        special_requirements: 'Wheelchair accessible',
      };

      const result = await service.createBooking(input);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          deposit_cents: 1000,
          special_requirements: 'Wheelchair accessible',
        })
      );
    });

    it('should throw error if creation fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const input = {
        trip_id: 'trip-123',
        venue_id: 'venue-123',
        experience_id: 'exp-123',
        scheduled_date: '2024-06-15',
        start_time: '09:00:00',
        end_time: '15:00:00',
        student_count: 25,
        quoted_price_cents: 5000,
      };

      await expect(service.createBooking(input)).rejects.toThrow();
    });
  });

  describe('getBookingById', () => {
    it('should retrieve booking by ID', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: 'confirmed',
      };

      mockSingle.mockResolvedValue({ data: mockBooking, error: null });

      const result = await service.getBookingById('booking-123');

      expect(mockFrom).toHaveBeenCalledWith('venue_bookings');
      expect(mockEq).toHaveBeenCalledWith('id', 'booking-123');
      expect(result).toEqual(mockBooking);
    });

    it('should return null if booking not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.getBookingById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getBookingByConfirmationNumber', () => {
    it('should retrieve booking by confirmation number', async () => {
      const mockBooking = {
        id: 'booking-123',
        confirmation_number: 'VB-20240315-A1B2',
      };

      mockSingle.mockResolvedValue({ data: mockBooking, error: null });

      const result = await service.getBookingByConfirmationNumber('VB-20240315-A1B2');

      expect(mockEq).toHaveBeenCalledWith('confirmation_number', 'VB-20240315-A1B2');
      expect(result).toEqual(mockBooking);
    });
  });

  describe('getBookingsByVenueId', () => {
    it('should retrieve all bookings for a venue', async () => {
      const mockBookings = [
        { id: 'booking-1', venue_id: 'venue-123', scheduled_date: '2024-06-15' },
        { id: 'booking-2', venue_id: 'venue-123', scheduled_date: '2024-07-20' },
      ];

      mockOrder.mockResolvedValue({ data: mockBookings, error: null });

      const result = await service.getBookingsByVenueId('venue-123');

      expect(mockEq).toHaveBeenCalledWith('venue_id', 'venue-123');
      expect(mockOrder).toHaveBeenCalledWith('scheduled_date', { ascending: true });
      expect(result).toEqual(mockBookings);
    });

    it('should filter by status', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await service.getBookingsByVenueId('venue-123', { status: 'confirmed' });

      expect(mockEq).toHaveBeenCalledWith('status', 'confirmed');
    });

    it('should filter by date range', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await service.getBookingsByVenueId('venue-123', {
        fromDate: '2024-06-01',
        toDate: '2024-06-30',
      });

      expect(mockGte).toHaveBeenCalledWith('scheduled_date', '2024-06-01');
      expect(mockLte).toHaveBeenCalledWith('scheduled_date', '2024-06-30');
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a booking', async () => {
      const currentBooking = {
        id: 'booking-123',
        status: 'pending',
      };
      
      const confirmedBooking = {
        id: 'booking-123',
        status: 'confirmed',
        confirmed_at: expect.any(String),
      };

      // First call is getBookingById, second is the update result
      mockSingle
        .mockResolvedValueOnce({ data: currentBooking, error: null })
        .mockResolvedValueOnce({ data: confirmedBooking, error: null });

      const result = await service.confirmBooking('booking-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
          confirmed_at: expect.any(String),
        })
      );
      expect(result.status).toBe('confirmed');
    });

    it('should add venue notes when confirming', async () => {
      const currentBooking = {
        id: 'booking-123',
        status: 'pending',
      };
      
      mockSingle
        .mockResolvedValueOnce({ data: currentBooking, error: null })
        .mockResolvedValueOnce({
          data: { id: 'booking-123', status: 'confirmed', venue_notes: 'Looking forward to your visit' },
          error: null,
        });

      await service.confirmBooking('booking-123', {
        venue_notes: 'Looking forward to your visit',
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          venue_notes: 'Looking forward to your visit',
        })
      );
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      const currentBooking = {
        id: 'booking-123',
        status: 'pending',
      };
      
      const cancelledBooking = {
        id: 'booking-123',
        status: 'cancelled',
        cancelled_at: expect.any(String),
      };

      // First call is getBookingById, second is the update result
      mockSingle
        .mockResolvedValueOnce({ data: currentBooking, error: null })
        .mockResolvedValueOnce({ data: cancelledBooking, error: null });

      const result = await service.cancelBooking('booking-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancelled_at: expect.any(String),
        })
      );
      expect(result.status).toBe('cancelled');
    });

    it('should add cancellation reason', async () => {
      const currentBooking = {
        id: 'booking-123',
        status: 'confirmed',
      };
      
      mockSingle
        .mockResolvedValueOnce({ data: currentBooking, error: null })
        .mockResolvedValueOnce({
          data: { id: 'booking-123', status: 'cancelled', internal_notes: 'Weather concerns' },
          error: null,
        });

      await service.cancelBooking('booking-123', { reason: 'Weather concerns' });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          internal_notes: 'Weather concerns',
        })
      );
    });
  });

  describe('updateBooking', () => {
    it('should update booking details', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'booking-123', student_count: 30 },
        error: null,
      });

      await service.updateBooking('booking-123', { student_count: 30 });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          student_count: 30,
        })
      );
    });

    it('should change status to modified when updating confirmed booking', async () => {
      // Mock getBookingById to return a confirmed booking
      mockSingle
        .mockResolvedValueOnce({
          data: { id: 'booking-123', status: 'confirmed' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'booking-123', status: 'modified' },
          error: null,
        });

      await service.updateBooking('booking-123', { scheduled_date: '2024-07-01' });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'modified',
        })
      );
    });
  });

  describe('Data Sharing Consents', () => {
    describe('upsertConsent', () => {
      it('should create new consent with default values', async () => {
        const mockConsent = {
          id: 'consent-123',
          student_id: 'student-123',
          parent_id: 'parent-123',
          booking_id: 'booking-123',
          share_basic_info: true,
          share_medical_info: false,
          share_contact_info: false,
          share_emergency_info: true,
          consented_at: '2024-03-15T10:00:00Z',
          revoked_at: null,
        };

        mockSingle.mockResolvedValue({ data: mockConsent, error: null });

        const input = {
          student_id: 'student-123',
          parent_id: 'parent-123',
          booking_id: 'booking-123',
        };

        const result = await service.upsertConsent(input);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            student_id: input.student_id,
            parent_id: input.parent_id,
            booking_id: input.booking_id,
            share_basic_info: true,
            share_medical_info: false,
            share_contact_info: false,
            share_emergency_info: true,
          }),
          { onConflict: 'student_id,booking_id' }
        );
        expect(result).toEqual(mockConsent);
      });

      it('should create consent with custom values', async () => {
        mockSingle.mockResolvedValue({ data: {}, error: null });

        const input = {
          student_id: 'student-123',
          parent_id: 'parent-123',
          booking_id: 'booking-123',
          share_basic_info: true,
          share_medical_info: true,
          share_contact_info: true,
          share_emergency_info: true,
        };

        await service.upsertConsent(input);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            share_medical_info: true,
            share_contact_info: true,
          }),
          { onConflict: 'student_id,booking_id' }
        );
      });
    });

    describe('getConsent', () => {
      it('should retrieve consent for student and booking', async () => {
        const mockConsent = {
          id: 'consent-123',
          student_id: 'student-123',
          booking_id: 'booking-123',
        };

        mockSingle.mockResolvedValue({ data: mockConsent, error: null });

        const result = await service.getConsent('student-123', 'booking-123');

        expect(mockEq).toHaveBeenCalledWith('student_id', 'student-123');
        expect(mockEq).toHaveBeenCalledWith('booking_id', 'booking-123');
        expect(result).toEqual(mockConsent);
      });

      it('should return null if consent not found', async () => {
        mockSingle.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        });

        const result = await service.getConsent('student-123', 'booking-123');

        expect(result).toBeNull();
      });
    });

    describe('getConsentsByBookingId', () => {
      it('should retrieve all active consents for a booking', async () => {
        const mockConsents = [
          { id: 'consent-1', student_id: 'student-1', revoked_at: null },
          { id: 'consent-2', student_id: 'student-2', revoked_at: null },
        ];

        mockIs.mockResolvedValue({ data: mockConsents, error: null });

        const result = await service.getConsentsByBookingId('booking-123');

        expect(mockEq).toHaveBeenCalledWith('booking_id', 'booking-123');
        expect(mockIs).toHaveBeenCalledWith('revoked_at', null);
        expect(result).toEqual(mockConsents);
      });
    });

    describe('revokeConsent', () => {
      it('should revoke consent', async () => {
        const mockConsent = {
          id: 'consent-123',
          revoked_at: expect.any(String),
        };

        mockSingle.mockResolvedValue({ data: mockConsent, error: null });

        const result = await service.revokeConsent('student-123', 'booking-123');

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            revoked_at: expect.any(String),
          })
        );
        expect(result.revoked_at).toBeTruthy();
      });
    });
  });

  describe('getSharedRosterData', () => {
    it('should return roster data structure', async () => {
      const mockBooking = {
        id: 'booking-123',
        venue_id: 'venue-123',
        student_count: 25,
      };

      const mockConsents = [
        { id: 'consent-1', student_id: 'student-1' },
        { id: 'consent-2', student_id: 'student-2' },
      ];

      mockSingle.mockResolvedValue({ data: mockBooking, error: null });
      mockIs.mockResolvedValue({ data: mockConsents, error: null });

      const result = await service.getSharedRosterData('booking-123');

      expect(result.booking_id).toBe('booking-123');
      expect(result.venue_id).toBe('venue-123');
      expect(result.consented_student_count).toBe(2);
      expect(result.total_student_count).toBe(25);
      expect(result.students).toEqual([]);
    });

    it('should throw error if booking not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.getSharedRosterData('nonexistent')).rejects.toThrow(
        'Booking not found'
      );
    });
  });
});
