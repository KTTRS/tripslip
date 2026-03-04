import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionSlipStatusList } from '../PermissionSlipStatusList';
import { createSupabaseClient } from '@tripslip/database';

// Mock Supabase client
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(),
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('PermissionSlipStatusList', () => {
  let mockSupabase: any;
  let mockChannel: any;
  let mockFrom: any;

  beforeEach(() => {
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn(() => mockFrom),
      channel: vi.fn(() => mockChannel),
    };

    (createSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    expect(screen.getByText('Loading permission slips...')).toBeInTheDocument();
  });

  it('should display permission slips with correct statuses', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        trip_id: 'test-trip-id',
        student_id: 'student-1',
        status: 'pending',
        signed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
          grade: '5th',
        },
        payments: [],
      },
      {
        id: 'slip-2',
        trip_id: 'test-trip-id',
        student_id: 'student-2',
        status: 'signed',
        signed_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        student: {
          id: 'student-2',
          first_name: 'Jane',
          last_name: 'Smith',
          grade: '6th',
        },
        payments: [],
      },
      {
        id: 'slip-3',
        trip_id: 'test-trip-id',
        student_id: 'student-3',
        status: 'signed',
        signed_at: '2024-01-03T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        student: {
          id: 'student-3',
          first_name: 'Bob',
          last_name: 'Johnson',
          grade: '5th',
        },
        payments: [
          {
            id: 'payment-1',
            status: 'succeeded',
            amount_cents: 5000,
            paid_at: '2024-01-04T00:00:00Z',
            created_at: '2024-01-04T00:00:00Z',
          },
        ],
      },
    ];

    mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('should display paid status when payment is successful', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        trip_id: 'test-trip-id',
        student_id: 'student-1',
        status: 'signed',
        signed_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
          grade: '5th',
        },
        payments: [
          {
            id: 'payment-1',
            status: 'succeeded',
            amount_cents: 5000,
            paid_at: '2024-01-04T00:00:00Z',
            created_at: '2024-01-04T00:00:00Z',
          },
        ],
      },
    ];

    mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Should show "Paid" status
    const paidBadges = screen.getAllByText('Paid');
    expect(paidBadges.length).toBeGreaterThan(0);
  });

  it('should display empty state when no slips exist', async () => {
    mockFrom.order.mockResolvedValue({ data: [], error: null });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(screen.getByText('No permission slips yet')).toBeInTheDocument();
      expect(
        screen.getByText('Add students to the roster to generate permission slips')
      ).toBeInTheDocument();
    });
  });

  it('should display error state when fetch fails', async () => {
    mockFrom.order.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load permission slips')).toBeInTheDocument();
    });
  });

  it('should set up real-time subscriptions on mount', async () => {
    mockFrom.order.mockResolvedValue({ data: [], error: null });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('permission_slips_test-trip-id');
      expect(mockSupabase.channel).toHaveBeenCalledWith('payments_test-trip-id');
    });

    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should unsubscribe from channels on unmount', async () => {
    mockFrom.order.mockResolvedValue({ data: [], error: null });

    const { unmount } = render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    unmount();

    expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(2);
  });

  it('should display status counts correctly', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        trip_id: 'test-trip-id',
        student_id: 'student-1',
        status: 'pending',
        signed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        student: { id: 'student-1', first_name: 'John', last_name: 'Doe', grade: '5th' },
        payments: [],
      },
      {
        id: 'slip-2',
        trip_id: 'test-trip-id',
        student_id: 'student-2',
        status: 'pending',
        signed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        student: { id: 'student-2', first_name: 'Jane', last_name: 'Smith', grade: '6th' },
        payments: [],
      },
      {
        id: 'slip-3',
        trip_id: 'test-trip-id',
        student_id: 'student-3',
        status: 'signed',
        signed_at: '2024-01-03T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        student: { id: 'student-3', first_name: 'Bob', last_name: 'Johnson', grade: '5th' },
        payments: [],
      },
      {
        id: 'slip-4',
        trip_id: 'test-trip-id',
        student_id: 'student-4',
        status: 'signed',
        signed_at: '2024-01-04T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        student: { id: 'student-4', first_name: 'Alice', last_name: 'Brown', grade: '6th' },
        payments: [{ id: 'payment-1', status: 'succeeded', amount_cents: 5000, paid_at: '2024-01-05T00:00:00Z', created_at: '2024-01-05T00:00:00Z' }],
      },
      {
        id: 'slip-5',
        trip_id: 'test-trip-id',
        student_id: 'student-5',
        status: 'cancelled',
        signed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        student: { id: 'student-5', first_name: 'Charlie', last_name: 'Davis', grade: '5th' },
        payments: [],
      },
    ];

    mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify counts in summary cards
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('SIGNED')).toBeInTheDocument();
    expect(screen.getByText('PAID')).toBeInTheDocument();
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });

  it('should show live updates indicator', async () => {
    mockFrom.order.mockResolvedValue({ data: [], error: null });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(screen.getByText('Live updates enabled')).toBeInTheDocument();
    });
  });

  it('should display signed date when available', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        trip_id: 'test-trip-id',
        student_id: 'student-1',
        status: 'signed',
        signed_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-01T00:00:00Z',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
          grade: '5th',
        },
        payments: [],
      },
    ];

    mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that the signed date is displayed
    expect(screen.getByText('1/15/2024')).toBeInTheDocument();
  });

  it('should show awaiting payment for signed slips without payment', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        trip_id: 'test-trip-id',
        student_id: 'student-1',
        status: 'signed',
        signed_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-01T00:00:00Z',
        student: {
          id: 'student-1',
          first_name: 'John',
          last_name: 'Doe',
          grade: '5th',
        },
        payments: [],
      },
    ];

    mockFrom.order.mockResolvedValue({ data: mockSlips, error: null });

    render(<PermissionSlipStatusList tripId="test-trip-id" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Awaiting payment')).toBeInTheDocument();
  });
});
