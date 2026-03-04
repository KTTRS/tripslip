import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FinancialDashboard } from '../FinancialDashboard';
import { supabase } from '@tripslip/database';

vi.mock('@tripslip/database', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('FinancialDashboard', () => {
  const mockBookings = [
    {
      id: 'booking-1',
      venue_id: 'venue-1',
      booking_date: '2024-06-15',
      total_amount: 50000,
      status: 'confirmed',
    },
    {
      id: 'booking-2',
      venue_id: 'venue-1',
      booking_date: '2024-06-20',
      total_amount: 30000,
      status: 'pending',
    },
    {
      id: 'booking-3',
      venue_id: 'venue-1',
      booking_date: '2024-07-10',
      total_amount: 40000,
      status: 'confirmed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        data: null,
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<FinancialDashboard venueId="venue-1" />);
    expect(screen.getByText('Loading financial data...')).toBeInTheDocument();
  });

  it('displays financial metrics after loading', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: mockBookings,
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<FinancialDashboard venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
    });

    // Total revenue: 50000 + 30000 + 40000 = 120000 cents = $1200.00
    expect(screen.getByText('$1200.00')).toBeInTheDocument();

    // Confirmed revenue: 50000 + 40000 = 90000 cents = $900.00
    expect(screen.getByText('$900.00')).toBeInTheDocument();

    // Pending revenue: 30000 cents = $300.00
    expect(screen.getByText('$300.00')).toBeInTheDocument();

    // Total bookings
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays upcoming payouts', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: mockBookings,
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<FinancialDashboard venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Payouts')).toBeInTheDocument();
    });

    // Should display 4 upcoming payouts
    const payoutAmounts = screen.getAllByText(/\$\d+\.\d{2}/);
    expect(payoutAmounts.length).toBeGreaterThan(4);
  });

  it('displays revenue by month', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: mockBookings,
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<FinancialDashboard venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('Revenue by Month')).toBeInTheDocument();
    });
  });

  it('handles empty bookings', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<FinancialDashboard venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
