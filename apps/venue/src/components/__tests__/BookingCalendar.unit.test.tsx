/**
 * Unit Tests - BookingCalendar Component
 * 
 * Tests the BookingCalendar component functionality including:
 * - Calendar rendering and navigation
 * - Booking display and filtering
 * - Date selection and modal interactions
 * - Status indicators and legends
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingCalendar } from '../BookingCalendar';
import type { VenueBooking } from '@tripslip/database';

// Mock date-fns to control date behavior in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    isToday: vi.fn((date: Date) => {
      const today = new Date('2024-01-15');
      return date.toDateString() === today.toDateString();
    }),
  };
});

const mockBookings: VenueBooking[] = [
  {
    id: 'booking-1',
    confirmation_number: 'CONF001',
    scheduled_date: '2024-01-15',
    start_time: '09:00',
    end_time: '11:00',
    student_count: 25,
    chaperone_count: 3,
    status: 'confirmed',
    special_requirements: 'Wheelchair accessible',
    venue_id: 'venue-1',
    experience_id: 'exp-1',
    teacher_id: 'teacher-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'booking-2',
    confirmation_number: 'CONF002',
    scheduled_date: '2024-01-15',
    start_time: '13:00',
    end_time: '15:00',
    student_count: 30,
    chaperone_count: 4,
    status: 'pending',
    special_requirements: null,
    venue_id: 'venue-1',
    experience_id: 'exp-2',
    teacher_id: 'teacher-2',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'booking-3',
    confirmation_number: 'CONF003',
    scheduled_date: '2024-01-20',
    start_time: '10:00',
    end_time: '12:00',
    student_count: 20,
    chaperone_count: 2,
    status: 'cancelled',
    special_requirements: null,
    venue_id: 'venue-1',
    experience_id: 'exp-1',
    teacher_id: 'teacher-3',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('BookingCalendar', () => {
  const mockOnBookingClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to January 15, 2024
    vi.setSystemTime(new Date('2024-01-15'));
  });

  it('renders calendar with current month', () => {
    render(<BookingCalendar bookings={[]} />);
    
    expect(screen.getByText('January 2024')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('displays day headers correctly', () => {
    render(<BookingCalendar bookings={[]} />);
    
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('shows bookings on correct dates', () => {
    render(<BookingCalendar bookings={mockBookings} />);
    
    // Should show 2 bookings on January 15th
    const jan15Bookings = screen.getAllByText('2');
    expect(jan15Bookings).toHaveLength(1); // One indicator showing "2" bookings
    
    // Should show 1 booking on January 20th
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays booking details in calendar cells', () => {
    render(<BookingCalendar bookings={mockBookings} />);
    
    // Check for booking time and student count
    expect(screen.getByText('09:00 - 25 students')).toBeInTheDocument();
    expect(screen.getByText('13:00 - 30 students')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 20 students')).toBeInTheDocument();
  });

  it('shows correct status indicators', () => {
    render(<BookingCalendar bookings={mockBookings} />);
    
    // Status indicators should be present (colored dots)
    const bookingElements = screen.getAllByText(/\d{2}:\d{2} - \d+ students/);
    expect(bookingElements).toHaveLength(3);
  });

  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={[]} />);
    
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);
    
    expect(screen.getByText('December 2023')).toBeInTheDocument();
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={[]} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    expect(screen.getByText('February 2024')).toBeInTheDocument();
  });

  it('returns to current month when Today button is clicked', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={[]} />);
    
    // Navigate away from current month
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(screen.getByText('February 2024')).toBeInTheDocument();
    
    // Click Today button
    const todayButton = screen.getByRole('button', { name: /today/i });
    await user.click(todayButton);
    
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('opens modal when clicking on date with bookings', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={mockBookings} />);
    
    // Find and click on January 15th (which has bookings)
    const jan15Cell = screen.getByText('15').closest('div');
    expect(jan15Cell).toBeInTheDocument();
    
    await user.click(jan15Cell!);
    
    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Bookings for January 15, 2024')).toBeInTheDocument();
    });
  });

  it('displays booking details in modal', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={mockBookings} />);
    
    // Click on January 15th
    const jan15Cell = screen.getByText('15').closest('div');
    await user.click(jan15Cell!);
    
    await waitFor(() => {
      // Check modal content
      expect(screen.getByText('Booking #CONF001')).toBeInTheDocument();
      expect(screen.getByText('Booking #CONF002')).toBeInTheDocument();
      expect(screen.getByText('09:00 - 11:00')).toBeInTheDocument();
      expect(screen.getByText('13:00 - 15:00')).toBeInTheDocument();
      expect(screen.getByText('25 students, 3 chaperones')).toBeInTheDocument();
      expect(screen.getByText('30 students, 4 chaperones')).toBeInTheDocument();
    });
  });

  it('shows special requirements in modal', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={mockBookings} />);
    
    // Click on January 15th
    const jan15Cell = screen.getByText('15').closest('div');
    await user.click(jan15Cell!);
    
    await waitFor(() => {
      expect(screen.getByText('Special Requirements:')).toBeInTheDocument();
      expect(screen.getByText('Wheelchair accessible')).toBeInTheDocument();
    });
  });

  it('calls onBookingClick when booking is clicked in calendar', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={mockBookings} onBookingClick={mockOnBookingClick} />);
    
    // Click on a booking in the calendar
    const bookingElement = screen.getByText('09:00 - 25 students');
    await user.click(bookingElement);
    
    expect(mockOnBookingClick).toHaveBeenCalledWith(mockBookings[0]);
  });

  it('calls onBookingClick when View Details is clicked in modal', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={mockBookings} onBookingClick={mockOnBookingClick} />);
    
    // Open modal
    const jan15Cell = screen.getByText('15').closest('div');
    await user.click(jan15Cell!);
    
    await waitFor(() => {
      const viewDetailsButtons = screen.getAllByText('View Details');
      expect(viewDetailsButtons).toHaveLength(2);
    });
    
    // Click first View Details button
    const viewDetailsButtons = screen.getAllByText('View Details');
    await user.click(viewDetailsButtons[0]);
    
    expect(mockOnBookingClick).toHaveBeenCalledWith(mockBookings[0]);
  });

  it('displays status legend correctly', () => {
    render(<BookingCalendar bookings={[]} />);
    
    const statusLabels = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Modified'];
    statusLabels.forEach(status => {
      expect(screen.getByText(status)).toBeInTheDocument();
    });
  });

  it('highlights today correctly', () => {
    render(<BookingCalendar bookings={[]} />);
    
    // January 15th should be highlighted as today
    const todayCell = screen.getByText('15').closest('div');
    expect(todayCell).toHaveClass('bg-blue-50');
  });

  it('shows truncated bookings with more indicator', () => {
    // Create more than 3 bookings for the same date
    const manyBookings: VenueBooking[] = Array.from({ length: 5 }, (_, i) => ({
      id: `booking-${i + 1}`,
      confirmation_number: `CONF00${i + 1}`,
      scheduled_date: '2024-01-15',
      start_time: `${9 + i}:00`,
      end_time: `${11 + i}:00`,
      student_count: 20 + i,
      chaperone_count: 2,
      status: 'confirmed',
      special_requirements: null,
      venue_id: 'venue-1',
      experience_id: 'exp-1',
      teacher_id: `teacher-${i + 1}`,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }));

    render(<BookingCalendar bookings={manyBookings} />);
    
    // Should show "+2 more" for the additional bookings
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('handles empty bookings array', () => {
    render(<BookingCalendar bookings={[]} />);
    
    // Should render calendar without errors
    expect(screen.getByText('January 2024')).toBeInTheDocument();
    
    // No booking indicators should be present
    const bookingIndicators = screen.queryAllByText(/\d{2}:\d{2} - \d+ students/);
    expect(bookingIndicators).toHaveLength(0);
  });

  it('does not open modal when clicking on date without bookings', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={mockBookings} />);
    
    // Click on a date without bookings (e.g., January 1st)
    const jan1Cell = screen.getByText('1').closest('div');
    await user.click(jan1Cell!);
    
    // Modal should not open
    expect(screen.queryByText(/Bookings for/)).not.toBeInTheDocument();
  });

  it('closes modal when clicking outside', async () => {
    const user = userEvent.setup();
    render(<BookingCalendar bookings={mockBookings} />);
    
    // Open modal
    const jan15Cell = screen.getByText('15').closest('div');
    await user.click(jan15Cell!);
    
    await waitFor(() => {
      expect(screen.getByText('Bookings for January 15, 2024')).toBeInTheDocument();
    });
    
    // Press Escape to close modal
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('Bookings for January 15, 2024')).not.toBeInTheDocument();
    });
  });
});