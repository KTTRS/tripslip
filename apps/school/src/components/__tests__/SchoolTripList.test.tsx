import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchoolTripList } from '../SchoolTripList';

// Mock the supabase client from lib/supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

describe('SchoolTripList', () => {
  const mockTrips = [
    {
      id: 'trip-1',
      trip_date: '2024-06-15',
      student_count: 25,
      status: 'approved',
      teacher: {
        name: 'Ms. Johnson',
        email: 'johnson@school.edu',
      },
      venue: {
        name: 'City Science Museum',
      },
      experience: {
        title: 'Dinosaur Discovery',
      },
    },
    {
      id: 'trip-2',
      trip_date: '2024-06-20',
      student_count: 30,
      status: 'pending_approval',
      teacher: {
        name: 'Mr. Smith',
        email: 'smith@school.edu',
      },
      venue: {
        name: 'Modern Art Gallery',
      },
      experience: {
        title: 'Contemporary Art Workshop',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
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

    render(<SchoolTripList schoolId="school-1" />);
    expect(screen.getByText('Loading trips...')).toBeInTheDocument();
  });

  it('displays all trips after loading', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTrips,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<SchoolTripList schoolId="school-1" />);

    await waitFor(() => {
      expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    });

    expect(screen.getByText('Contemporary Art Workshop')).toBeInTheDocument();
    expect(screen.getByText('Ms. Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mr. Smith')).toBeInTheDocument();
    expect(screen.getByText('2 trips')).toBeInTheDocument();
  });

  it('filters trips by search term', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTrips,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const user = userEvent.setup();
    render(<SchoolTripList schoolId="school-1" />);

    await waitFor(() => {
      expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search trips, teachers, or venues/i
    );
    await user.type(searchInput, 'Dinosaur');

    expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    expect(screen.queryByText('Contemporary Art Workshop')).not.toBeInTheDocument();
  });

  it('filters trips by status', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTrips,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const user = userEvent.setup();
    render(<SchoolTripList schoolId="school-1" />);

    await waitFor(() => {
      expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole('combobox');
    await user.selectOptions(statusSelect, 'approved');

    expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    expect(screen.queryByText('Contemporary Art Workshop')).not.toBeInTheDocument();
  });

  it('displays empty state when no trips', async () => {
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

    render(<SchoolTripList schoolId="school-1" />);

    await waitFor(() => {
      expect(screen.getByText('No trips found')).toBeInTheDocument();
    });
  });

  it('displays trip details correctly', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTrips,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<SchoolTripList schoolId="school-1" />);

    await waitFor(() => {
      expect(screen.getByText('Dinosaur Discovery')).toBeInTheDocument();
    });

    expect(screen.getByText('Students: 25')).toBeInTheDocument();
    expect(screen.getByText('approved')).toBeInTheDocument();
  });
});
