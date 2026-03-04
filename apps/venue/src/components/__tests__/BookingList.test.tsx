import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingList } from '../BookingList';
import { supabase } from '@tripslip/database';

vi.mock('@tripslip/database', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

describe('BookingList', () => {
  const mockBookings = [
    {
      id: 'booking-1',
      venue_id: 'venue-1',
      trip_id: 'trip-1',
      experience_id: 'exp-1',
      booking_date: '2024-06-15',
      student_count: 25,
      total_amount: 50000,
      status: 'pending',
      trip: {
        name: 'Science Museum Visit',
        teacher_name: 'Ms. Johnson',
        school_name: 'Lincoln Elementary',
      },
      experience: {
        name: 'Dinosaur Discovery',
      },
    },
    {
      id: 'booking-2',
      venue_id: 'venue-1',
      trip_id: 'trip-2',
      experience_id: 'exp-2',
      booking_date: '2024-06-20',
      student_count: 30,
      total_amount: 60000,
      status: 'confirmed',
      trip: {
        name: 'Art Gallery Tour',
        teacher_name: 'Mr. Smith',
        school_name: 'Washington Middle School',
      },
      experience: {
        name: 'Modern Art Workshop',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    vi.mocked(supabase.channel).mockReturnValue(mockChannel as any);
  });

  it('renders loading state initially', () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<BookingList venueId="venue-1" />);
    expect(screen.getByText('Loading bookings...')).toBeInTheDocument();
  });

  it('displays bookings after loading', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockBookings,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<BookingList venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    });

    expect(screen.getByText('Science Museum Visit')).toBeInTheDocument();
    expect(screen.getByText('Ms. Johnson')).toBeInTheDocument();
    expect(screen.getByText('Lincoln Elementary')).toBeInTheDocument();
  });

  it('filters bookings by status', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockBookings,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const user = userEvent.setup();
    render(<BookingList venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    });

    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'confirmed');

    expect(screen.queryByText('Dinosaur Discovery')).not.toBeInTheDocument();
    expect(screen.getByText('Modern Art Workshop')).toBeInTheDocument();
  });

  it('confirms a pending booking', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockBookings,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          select: mockSelect,
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      return {} as any;
    });

    const user = userEvent.setup();
    render(<BookingList venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });
  });

  it('cancels a pending booking', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockBookings,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          select: mockSelect,
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      return {} as any;
    });

    const user = userEvent.setup();
    render(<BookingList venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });
  });

  it('displays empty state when no bookings', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<BookingList venueId="venue-1" />);

    await waitFor(() => {
      expect(screen.getByText('No bookings found')).toBeInTheDocument();
    });
  });
});
