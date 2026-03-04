import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TripStatistics } from '../TripStatistics';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the database client
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(),
}));

describe('TripStatistics', () => {
  let mockSupabase: any;
  let mockChannel: any;

  beforeEach(async () => {
    // Create mock channel
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      channel: vi.fn(() => mockChannel),
    };

    // Mock the createSupabaseClient function
    const { createSupabaseClient } = await import('@tripslip/database');
    vi.mocked(createSupabaseClient).mockReturnValue(mockSupabase as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    // Setup mock to delay response
    mockSupabase.eq.mockReturnValue({
      then: () => new Promise(() => {}), // Never resolves
    });

    render(<TripStatistics tripId="trip-123" />);

    expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
  });

  it('should display error state when fetch fails', async () => {
    // Setup mock to return error
    mockSupabase.eq.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load trip statistics')).toBeInTheDocument();
    });
  });

  it('should calculate and display statistics correctly with no students', async () => {
    // Setup mock to return empty data
    mockSupabase.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    // Check all stat cards
    const totalStudentsCards = screen.getAllByText('0');
    expect(totalStudentsCards.length).toBeGreaterThan(0);
  });

  it('should calculate statistics correctly with mixed slip statuses', async () => {
    // Setup mock data with various statuses
    const mockSlips = [
      {
        id: 'slip-1',
        status: 'pending',
        signed_at: null,
        payments: [],
      },
      {
        id: 'slip-2',
        status: 'signed',
        signed_at: '2024-01-15T10:00:00Z',
        payments: [],
      },
      {
        id: 'slip-3',
        status: 'signed',
        signed_at: '2024-01-16T10:00:00Z',
        payments: [
          {
            id: 'payment-1',
            amount_cents: 5000,
            status: 'succeeded',
            paid_at: '2024-01-16T11:00:00Z',
          },
        ],
      },
      {
        id: 'slip-4',
        status: 'signed',
        signed_at: '2024-01-17T10:00:00Z',
        payments: [
          {
            id: 'payment-2',
            amount_cents: 7500,
            status: 'succeeded',
            paid_at: '2024-01-17T11:00:00Z',
          },
        ],
      },
    ];

    mockSupabase.eq.mockResolvedValue({
      data: mockSlips,
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      // Total payments received: $125.00 (5000 + 7500 cents)
      expect(screen.getByText('$125.00')).toBeInTheDocument();
      
      // Completion rate: 50% (2 paid out of 4 total)
      expect(screen.getByText('50%')).toBeInTheDocument();
      
      // Check the completion ratio text
      expect(screen.getByText('(2/4)')).toBeInTheDocument();
    });
  });

  it('should calculate payment totals correctly', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        status: 'signed',
        signed_at: '2024-01-15T10:00:00Z',
        payments: [
          {
            id: 'payment-1',
            amount_cents: 10000,
            status: 'succeeded',
            paid_at: '2024-01-15T11:00:00Z',
          },
        ],
      },
      {
        id: 'slip-2',
        status: 'signed',
        signed_at: '2024-01-16T10:00:00Z',
        payments: [
          {
            id: 'payment-2',
            amount_cents: 15000,
            status: 'succeeded',
            paid_at: '2024-01-16T11:00:00Z',
          },
        ],
      },
    ];

    mockSupabase.eq.mockResolvedValue({
      data: mockSlips,
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      // Total payments: $250.00 (10000 + 15000 cents)
      expect(screen.getByText('$250.00')).toBeInTheDocument();
    });
  });

  it('should handle split payments correctly', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        status: 'signed',
        signed_at: '2024-01-15T10:00:00Z',
        payments: [
          {
            id: 'payment-1',
            amount_cents: 5000,
            status: 'succeeded',
            paid_at: '2024-01-15T11:00:00Z',
          },
          {
            id: 'payment-2',
            amount_cents: 5000,
            status: 'succeeded',
            paid_at: '2024-01-15T12:00:00Z',
          },
        ],
      },
    ];

    mockSupabase.eq.mockResolvedValue({
      data: mockSlips,
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      // Total should be sum of both payments: $100.00
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      
      // Completion rate: 100% (1 paid out of 1 total)
      expect(screen.getByText('100%')).toBeInTheDocument();
      
      // Check the completion ratio
      expect(screen.getByText('(1/1)')).toBeInTheDocument();
    });
  });

  it('should only count succeeded payments in totals', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        status: 'signed',
        signed_at: '2024-01-15T10:00:00Z',
        payments: [
          {
            id: 'payment-1',
            amount_cents: 10000,
            status: 'succeeded',
            paid_at: '2024-01-15T11:00:00Z',
          },
          {
            id: 'payment-2',
            amount_cents: 5000,
            status: 'pending',
            paid_at: null,
          },
          {
            id: 'payment-3',
            amount_cents: 3000,
            status: 'failed',
            paid_at: null,
          },
        ],
      },
    ];

    mockSupabase.eq.mockResolvedValue({
      data: mockSlips,
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      // Should only count succeeded payment: $100.00
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      
      // Expected total includes all payments: $180.00
      expect(screen.getByText('$180.00')).toBeInTheDocument();
    });
  });

  it('should set up real-time subscriptions', async () => {
    mockSupabase.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('trip_stats_trip-123');
      expect(mockChannel.on).toHaveBeenCalledTimes(2); // Two subscriptions
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  it('should unsubscribe from real-time updates on unmount', async () => {
    mockSupabase.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    const { unmount } = render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    unmount();

    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });

  it('should display live updates indicator', async () => {
    mockSupabase.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      expect(screen.getByText('Live updates enabled')).toBeInTheDocument();
    });
  });

  it('should calculate completion percentage correctly', async () => {
    const mockSlips = [
      {
        id: 'slip-1',
        status: 'pending',
        signed_at: null,
        payments: [],
      },
      {
        id: 'slip-2',
        status: 'signed',
        signed_at: '2024-01-15T10:00:00Z',
        payments: [
          {
            id: 'payment-1',
            amount_cents: 5000,
            status: 'succeeded',
            paid_at: '2024-01-15T11:00:00Z',
          },
        ],
      },
      {
        id: 'slip-3',
        status: 'signed',
        signed_at: '2024-01-16T10:00:00Z',
        payments: [],
      },
      {
        id: 'slip-4',
        status: 'signed',
        signed_at: '2024-01-17T10:00:00Z',
        payments: [
          {
            id: 'payment-2',
            amount_cents: 7500,
            status: 'succeeded',
            paid_at: '2024-01-17T11:00:00Z',
          },
        ],
      },
    ];

    mockSupabase.eq.mockResolvedValue({
      data: mockSlips,
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      // 2 paid out of 4 total = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('(2/4)')).toBeInTheDocument();
    });
  });

  it('should display all statistic cards with correct labels', async () => {
    mockSupabase.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<TripStatistics tripId="trip-123" />);

    await waitFor(() => {
      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Signed')).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    });
  });
});
