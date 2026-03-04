import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VenueBookingService } from '../../venue-booking-service';
import { createMockSupabaseClient } from '@tripslip/test-utils';

describe('VenueBookingService', () => {
  let service: VenueBookingService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new VenueBookingService(mockSupabase);
  });

  describe('createBooking', () => {
    it('creates a new booking with valid input', async () => {
      const input = {
        tripId: 'trip-123',
        venueId: 'venue-123',
        experienceId: 'experience-123',
        requestedDate: '2024-02-15',
        requestedTime: '10:00',
        studentCount: 25,
        chaperoneCount: 3,
        specialRequirements: 'Wheelchair accessible',
        contactEmail: 'teacher@school.edu',
        contactPhone: '+1234567890',
      };

      const mockBooking = {
        id: 'booking-123',
        ...input,
        status: 'pending',
        confirmation_number: 'CONF123456',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.createBooking(input);

      expect(result).toEqual(mockBooking);
      expect(mockSupabase.from).toHaveBeenCalledWith('venue_bookings');
    });

    it('validates required fields', async () => {
      const invalidInput = {
        tripId: '',
        venueId: 'venue-123',
        experienceId: 'experience-123',
        requestedDate: '2024-02-15',
        requestedTime: '10:00',
        studentCount: 25,
        chaperoneCount: 3,
        contactEmail: 'teacher@school.edu',
        contactPhone: '+1234567890',
      };

      await expect(service.createBooking(invalidInput)).rejects.toThrow();
    });

    it('generates unique confirmation number', async () => {
      const input = {
        tripId: 'trip-123',
        venueId: 'venue-123',
        experienceId: 'experience-123',
        requestedDate: '2024-02-15',
        requestedTime: '10:00',
        studentCount: 25,
        chaperoneCount: 3,
        contactEmail: 'teacher@school.edu',
        contactPhone: '+1234567890',
      };

      const mockBooking = {
        id: 'booking-123',
        ...input,
        confirmation_number: 'CONF123456',
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.createBooking(input);

      expect(result.confirmation_number).toBeDefined();
      expect(result.confirmation_number).toMatch(/^[A-Z0-9]+$/);
    });
  });

  describe('getBookingById', () => {
    it('retrieves booking by ID', async () => {
      const bookingId = 'booking-123';
      const mockBooking = {
        id: bookingId,
        trip_id: 'trip-123',
        venue_id: 'venue-123',
        status: 'confirmed',
        confirmation_number: 'CONF123456',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getBookingById(bookingId);

      expect(result).toEqual(mockBooking);
    });

    it('returns null when booking not found', async () => {
      const bookingId = 'nonexistent-booking';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await service.getBookingById(bookingId);

      expect(result).toBeNull();
    });
  });

  describe('getBookingByConfirmationNumber', () => {
    it('retrieves booking by confirmation number', async () => {
      const confirmationNumber = 'CONF123456';
      const mockBooking = {
        id: 'booking-123',
        confirmation_number: confirmationNumber,
        status: 'confirmed',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getBookingByConfirmationNumber(confirmationNumber);

      expect(result).toEqual(mockBooking);
    });
  });

  describe('confirmBooking', () => {
    it('confirms a pending booking', async () => {
      const bookingId = 'booking-123';
      const mockBooking = {
        id: bookingId,
        status: 'pending',
      };

      const confirmedBooking = {
        ...mockBooking,
        status: 'confirmed',
        confirmed_at: '2024-01-01T12:00:00Z',
      };

      // Mock getting current booking
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      });

      // Mock updating booking
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: confirmedBooking,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.confirmBooking(bookingId);

      expect(result.status).toBe('confirmed');
      expect(result.confirmed_at).toBeDefined();
    });

    it('throws error when trying to confirm non-pending booking', async () => {
      const bookingId = 'booking-123';
      const mockBooking = {
        id: bookingId,
        status: 'confirmed',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      });

      await expect(service.confirmBooking(bookingId)).rejects.toThrow(
        'Invalid status transition'
      );
    });
  });

  describe('cancelBooking', () => {
    it('cancels a booking with reason', async () => {
      const bookingId = 'booking-123';
      const cancelInput = {
        reason: 'Trip cancelled by school',
      };

      const mockBooking = {
        id: bookingId,
        status: 'confirmed',
      };

      const cancelledBooking = {
        ...mockBooking,
        status: 'cancelled',
        cancelled_at: '2024-01-01T12:00:00Z',
        cancellation_reason: cancelInput.reason,
      };

      // Mock getting current booking
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      });

      // Mock updating booking
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: cancelledBooking,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.cancelBooking(bookingId, cancelInput);

      expect(result.status).toBe('cancelled');
      expect(result.cancellation_reason).toBe(cancelInput.reason);
    });
  });

  describe('checkAvailability', () => {
    it('checks availability for a given date and time', async () => {
      const venueId = 'venue-123';
      const experienceId = 'experience-123';
      const date = '2024-02-15';
      const time = '10:00';
      const studentCount = 25;

      // Mock experience capacity
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { capacity: 30 },
              error: null,
            }),
          }),
        }),
      });

      // Mock existing bookings
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    { student_count: 5 }, // Existing booking with 5 students
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.checkAvailability(
        venueId,
        experienceId,
        date,
        time,
        studentCount
      );

      expect(result.available).toBe(true);
      expect(result.remainingCapacity).toBe(25); // 30 - 5 = 25
    });

    it('returns false when capacity is exceeded', async () => {
      const venueId = 'venue-123';
      const experienceId = 'experience-123';
      const date = '2024-02-15';
      const time = '10:00';
      const studentCount = 30;

      // Mock experience capacity
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { capacity: 25 },
              error: null,
            }),
          }),
        }),
      });

      // Mock existing bookings
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.checkAvailability(
        venueId,
        experienceId,
        date,
        time,
        studentCount
      );

      expect(result.available).toBe(false);
      expect(result.reason).toContain('exceeds capacity');
    });
  });

  describe('getRemainingCapacity', () => {
    it('calculates remaining capacity correctly', async () => {
      const venueId = 'venue-123';
      const experienceId = 'experience-123';
      const date = '2024-02-15';
      const time = '10:00';

      // Mock experience capacity
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { capacity: 50 },
              error: null,
            }),
          }),
        }),
      });

      // Mock existing bookings
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    { student_count: 15 },
                    { student_count: 10 },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getRemainingCapacity(
        venueId,
        experienceId,
        date,
        time
      );

      expect(result).toBe(25); // 50 - 15 - 10 = 25
    });
  });

  describe('error handling', () => {
    it('handles database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection error' },
            }),
          }),
        }),
      });

      await expect(service.getBookingById('booking-123')).rejects.toThrow(
        'Database connection error'
      );
    });

    it('validates required parameters', async () => {
      await expect(service.getBookingById('')).rejects.toThrow();
      await expect(service.confirmBooking('')).rejects.toThrow();
      await expect(service.cancelBooking('')).rejects.toThrow();
    });
  });

  describe('status transitions', () => {
    it('validates valid status transitions', () => {
      // Access private method for testing
      const validateTransition = (service as any).validateStatusTransition;

      expect(() => validateTransition('pending', 'confirmed')).not.toThrow();
      expect(() => validateTransition('confirmed', 'completed')).not.toThrow();
      expect(() => validateTransition('pending', 'cancelled')).not.toThrow();
    });

    it('rejects invalid status transitions', () => {
      const validateTransition = (service as any).validateStatusTransition;

      expect(() => validateTransition('completed', 'pending')).toThrow();
      expect(() => validateTransition('cancelled', 'confirmed')).toThrow();
    });
  });
});