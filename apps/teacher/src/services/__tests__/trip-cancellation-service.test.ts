import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TripCancellationService } from '../trip-cancellation-service';

// Mock the Supabase client
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: () => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          neq: vi.fn(),
        })),
        neq: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  }),
}));

// Mock fetch for Edge Function calls
global.fetch = vi.fn();

describe('TripCancellationService', () => {
  let service: TripCancellationService;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TripCancellationService();
    mockSupabase = (service as any).supabase;
  });

  describe('canCancelTrip', () => {
    it('should return true for pending trips', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'trip-1', status: 'pending' },
              error: null,
            }),
          }),
        }),
      });

      const result = await service.canCancelTrip('trip-1');

      expect(result.canCancel).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return true for confirmed trips', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'trip-1', status: 'confirmed' },
              error: null,
            }),
          }),
        }),
      });

      const result = await service.canCancelTrip('trip-1');

      expect(result.canCancel).toBe(true);
    });

    it('should return false for already cancelled trips', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'trip-1', status: 'cancelled' },
              error: null,
            }),
          }),
        }),
      });

      const result = await service.canCancelTrip('trip-1');

      expect(result.canCancel).toBe(false);
      expect(result.reason).toBe('Trip is already cancelled');
    });

    it('should return false for completed trips', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'trip-1', status: 'completed' },
              error: null,
            }),
          }),
        }),
      });

      const result = await service.canCancelTrip('trip-1');

      expect(result.canCancel).toBe(false);
      expect(result.reason).toBe('Cannot cancel a completed trip');
    });

    it('should return false for non-existent trips', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await service.canCancelTrip('non-existent');

      expect(result.canCancel).toBe(false);
      expect(result.reason).toBe('Trip not found');
    });
  });

  describe('cancelTrip', () => {
    it('should throw error if trip not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      await expect(service.cancelTrip('non-existent')).rejects.toThrow('Trip not found');
    });

    it('should throw error if trip is already cancelled', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'trip-1',
                status: 'cancelled',
                trip_date: '2024-06-01',
                experiences: { name: 'Museum Tour' },
              },
              error: null,
            }),
          }),
        }),
      });

      await expect(service.cancelTrip('trip-1')).rejects.toThrow('Trip is already cancelled');
    });

    it('should throw error if trip is completed', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'trip-1',
                status: 'completed',
                trip_date: '2024-06-01',
                experiences: { name: 'Museum Tour' },
              },
              error: null,
            }),
          }),
        }),
      });

      await expect(service.cancelTrip('trip-1')).rejects.toThrow('Cannot cancel a completed trip');
    });

    it('should successfully cancel trip with no permission slips', async () => {
      // Mock trip fetch
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'trip-1',
                    status: 'pending',
                    trip_date: '2024-06-01',
                    experiences: { name: 'Museum Tour' },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        } else if (table === 'permission_slips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await service.cancelTrip('trip-1');

      expect(result.tripId).toBe('trip-1');
      expect(result.cancelledSlipsCount).toBe(0);
      expect(result.refundsInitiated).toBe(0);
      expect(result.notificationsSent).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should cancel trip and send notifications for unpaid slips', async () => {
      const mockSlips = [
        {
          id: 'slip-1',
          status: 'signed',
          students: {
            id: 'student-1',
            first_name: 'John',
            last_name: 'Doe',
            parents: {
              id: 'parent-1',
              email: 'parent@example.com',
              first_name: 'Jane',
              preferred_language: 'en',
            },
          },
        },
      ];

      // Mock trip and slips fetch
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'trip-1',
                    status: 'pending',
                    trip_date: '2024-06-01',
                    experiences: { name: 'Museum Tour' },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        } else if (table === 'permission_slips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({
                  data: mockSlips,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return {};
      });

      // Mock email send
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await service.cancelTrip('trip-1');

      expect(result.cancelledSlipsCount).toBe(1);
      expect(result.refundsInitiated).toBe(0);
      expect(result.notificationsSent).toBe(1);
      expect(result.errors).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/send-email'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('trip_cancelled'),
        })
      );
    });

    it('should cancel trip, initiate refunds, and send notifications for paid slips', async () => {
      const mockSlips = [
        {
          id: 'slip-1',
          status: 'paid',
          students: {
            id: 'student-1',
            first_name: 'John',
            last_name: 'Doe',
            parents: {
              id: 'parent-1',
              email: 'parent@example.com',
              first_name: 'Jane',
              preferred_language: 'en',
            },
          },
        },
      ];

      const mockPayments = [
        {
          id: 'payment-1',
          amount_cents: 5000,
          status: 'succeeded',
        },
      ];

      // Mock database calls
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'trip-1',
                    status: 'pending',
                    trip_date: '2024-06-01',
                    experiences: { name: 'Museum Tour' },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        } else if (table === 'permission_slips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({
                  data: mockSlips,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        } else if (table === 'payments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockPayments,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Mock refund and email API calls
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await service.cancelTrip('trip-1');

      expect(result.cancelledSlipsCount).toBe(1);
      expect(result.refundsInitiated).toBe(1);
      expect(result.notificationsSent).toBe(1);
      expect(result.errors).toEqual([]);
      
      // Verify refund API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/create-refund'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('payment-1'),
        })
      );
      
      // Verify email API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/send-email'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('trip_cancelled'),
        })
      );
    });

    it('should collect errors but continue processing when refund fails', async () => {
      const mockSlips = [
        {
          id: 'slip-1',
          status: 'paid',
          students: {
            id: 'student-1',
            first_name: 'John',
            last_name: 'Doe',
            parents: {
              id: 'parent-1',
              email: 'parent@example.com',
              first_name: 'Jane',
              preferred_language: 'en',
            },
          },
        },
      ];

      const mockPayments = [
        {
          id: 'payment-1',
          amount_cents: 5000,
          status: 'succeeded',
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'trip-1',
                    status: 'pending',
                    trip_date: '2024-06-01',
                    experiences: { name: 'Museum Tour' },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        } else if (table === 'permission_slips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({
                  data: mockSlips,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        } else if (table === 'payments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockPayments,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Mock refund failure and email success
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('create-refund')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Refund failed' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      });

      const result = await service.cancelTrip('trip-1');

      expect(result.cancelledSlipsCount).toBe(1);
      expect(result.refundsInitiated).toBe(0);
      expect(result.notificationsSent).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to initiate refund');
    });

    it('should collect errors when email notification fails', async () => {
      const mockSlips = [
        {
          id: 'slip-1',
          status: 'signed',
          students: {
            id: 'student-1',
            first_name: 'John',
            last_name: 'Doe',
            parents: {
              id: 'parent-1',
              email: 'parent@example.com',
              first_name: 'Jane',
              preferred_language: 'en',
            },
          },
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'trips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'trip-1',
                    status: 'pending',
                    trip_date: '2024-06-01',
                    experiences: { name: 'Museum Tour' },
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        } else if (table === 'permission_slips') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({
                  data: mockSlips,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return {};
      });

      // Mock email failure
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Email service unavailable' }),
      });

      const result = await service.cancelTrip('trip-1');

      expect(result.cancelledSlipsCount).toBe(1);
      expect(result.notificationsSent).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to send notification');
    });
  });
});
