import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionSlipService } from '../../permission-slip-service';
import { createMockSupabaseClient } from '@tripslip/test-utils';

// Mock crypto for secure token generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: vi.fn(() => Buffer.from('mock-random-bytes')),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

describe('PermissionSlipService', () => {
  let service: PermissionSlipService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new PermissionSlipService(mockSupabase);
  });

  describe('generatePermissionSlips', () => {
    it('generates permission slips for all students in a trip', async () => {
      const input = {
        tripId: 'trip-123',
        studentIds: ['student-1', 'student-2', 'student-3'],
        dueDate: '2024-02-01',
        additionalFees: [
          { name: 'Lunch', amountCents: 1200, required: false },
        ],
      };

      // Mock successful database operations
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 'slip-1', student_id: 'student-1', magic_link_token: 'token-1' },
              { id: 'slip-2', student_id: 'student-2', magic_link_token: 'token-2' },
              { id: 'slip-3', student_id: 'student-3', magic_link_token: 'token-3' },
            ],
            error: null,
          }),
        }),
      });

      const result = await service.generatePermissionSlips(input);

      expect(result.success).toBe(true);
      expect(result.permissionSlips).toHaveLength(3);
      expect(result.permissionSlips[0]).toMatchObject({
        id: 'slip-1',
        student_id: 'student-1',
        magic_link_token: 'token-1',
      });
    });

    it('handles database errors gracefully', async () => {
      const input = {
        tripId: 'trip-123',
        studentIds: ['student-1'],
        dueDate: '2024-02-01',
        additionalFees: [],
      };

      // Mock database error
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const result = await service.generatePermissionSlips(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.permissionSlips).toHaveLength(0);
    });

    it('validates input parameters', async () => {
      const invalidInput = {
        tripId: '',
        studentIds: [],
        dueDate: '',
        additionalFees: [],
      };

      const result = await service.generatePermissionSlips(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
    });

    it('includes additional fees in permission slips', async () => {
      const input = {
        tripId: 'trip-123',
        studentIds: ['student-1'],
        dueDate: '2024-02-01',
        additionalFees: [
          { name: 'Lunch', amountCents: 1200, required: false },
          { name: 'Transportation', amountCents: 800, required: true },
        ],
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'slip-1',
                student_id: 'student-1',
                additional_fees: input.additionalFees,
              },
            ],
            error: null,
          }),
        }),
      });

      const result = await service.generatePermissionSlips(input);

      expect(result.success).toBe(true);
      expect(result.permissionSlips[0].additional_fees).toEqual(input.additionalFees);
    });
  });

  describe('getPermissionSlipById', () => {
    it('retrieves permission slip by ID', async () => {
      const slipId = 'slip-123';
      const mockSlip = {
        id: slipId,
        trip_id: 'trip-123',
        student_id: 'student-123',
        status: 'pending',
        magic_link_token: 'token-123',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSlip,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getPermissionSlipById(slipId);

      expect(result).toEqual(mockSlip);
      expect(mockSupabase.from).toHaveBeenCalledWith('permission_slips');
    });

    it('returns null when permission slip not found', async () => {
      const slipId = 'nonexistent-slip';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found error
            }),
          }),
        }),
      });

      const result = await service.getPermissionSlipById(slipId);

      expect(result).toBeNull();
    });

    it('throws error for database errors', async () => {
      const slipId = 'slip-123';

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

      await expect(service.getPermissionSlipById(slipId)).rejects.toThrow(
        'Database connection error'
      );
    });
  });

  describe('getPermissionSlipsByTripId', () => {
    it('retrieves all permission slips for a trip', async () => {
      const tripId = 'trip-123';
      const mockSlips = [
        { id: 'slip-1', trip_id: tripId, student_id: 'student-1', status: 'pending' },
        { id: 'slip-2', trip_id: tripId, student_id: 'student-2', status: 'signed' },
        { id: 'slip-3', trip_id: tripId, student_id: 'student-3', status: 'paid' },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockSlips,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getPermissionSlipsByTripId(tripId);

      expect(result).toEqual(mockSlips);
      expect(mockSupabase.from).toHaveBeenCalledWith('permission_slips');
    });

    it('returns empty array when no permission slips found', async () => {
      const tripId = 'trip-with-no-slips';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getPermissionSlipsByTripId(tripId);

      expect(result).toEqual([]);
    });
  });

  describe('getPermissionSlipByTripAndStudent', () => {
    it('retrieves permission slip for specific trip and student', async () => {
      const tripId = 'trip-123';
      const studentId = 'student-123';
      const mockSlip = {
        id: 'slip-123',
        trip_id: tripId,
        student_id: studentId,
        status: 'pending',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockSlip,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getPermissionSlipByTripAndStudent(tripId, studentId);

      expect(result).toEqual(mockSlip);
    });

    it('returns null when no matching permission slip found', async () => {
      const tripId = 'trip-123';
      const studentId = 'nonexistent-student';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const result = await service.getPermissionSlipByTripAndStudent(tripId, studentId);

      expect(result).toBeNull();
    });
  });

  describe('getPermissionSlipStatusCounts', () => {
    it('returns status counts for a trip', async () => {
      const tripId = 'trip-123';
      const mockCounts = {
        pending: 5,
        signed: 3,
        paid: 2,
        total: 10,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { status: 'pending', count: 5 },
              { status: 'signed', count: 3 },
              { status: 'paid', count: 2 },
            ],
            error: null,
          }),
        }),
      });

      const result = await service.getPermissionSlipStatusCounts(tripId);

      expect(result.pending).toBe(5);
      expect(result.signed).toBe(3);
      expect(result.paid).toBe(2);
      expect(result.total).toBe(10);
    });

    it('handles empty results gracefully', async () => {
      const tripId = 'trip-with-no-slips';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await service.getPermissionSlipStatusCounts(tripId);

      expect(result.pending).toBe(0);
      expect(result.signed).toBe(0);
      expect(result.paid).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('generateSecureToken', () => {
    it('generates a secure token of specified length', () => {
      // Access private method through type assertion for testing
      const token = (service as any).generateSecureToken(32);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('generates different tokens on subsequent calls', () => {
      const token1 = (service as any).generateSecureToken(32);
      const token2 = (service as any).generateSecureToken(32);

      expect(token1).not.toBe(token2);
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(service.getPermissionSlipById('slip-123')).rejects.toThrow('Network error');
    });

    it('validates required parameters', async () => {
      await expect(service.getPermissionSlipById('')).rejects.toThrow();
      await expect(service.getPermissionSlipsByTripId('')).rejects.toThrow();
    });
  });
});