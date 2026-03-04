/**
 * Unit Tests - SchoolTripList Component
 * 
 * Tests the SchoolTripList component functionality including:
 * - Trip list rendering
 * - Filtering and sorting
 * - Status indicators
 * - Action buttons
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchoolTripList } from '../SchoolTripList';
import type { Trip } from '@tripslip/database';

// Mock the database service
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(() => ({})),
}));

const mockTrips: Trip[] = [
  {
    id: 'trip-1',
    title: 'Science Museum Visit',
    description: 'Educational trip to the science museum',
    scheduled_date: '2024-02-15',
    start_time: '09:00',
    end_time: '15:00',
    status: 'pending_approval',
    teacher_id: 'teacher-1',
    venue_id: 'venue-1',
    experience_id: 'exp-1',
    student_count: 25,
    chaperone_count: 3,
    estimated_cost_cents: 2500,
    special_requirements: 'Wheelchair accessible',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    teacher: {
      id: 'teacher-1',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@school.edu',
    },
    venue: {
      id: 'venue-1',
      name: 'City Science Museum',
      address: '123 Science St',
    },
    experience: {
      id: 'exp-1',
      title: 'Space Exploration',
      duration_minutes: 120,
    },
  },
  {
    id: 'trip-2',
    title: 'Art Gallery Tour',
    description: 'Visit to the local art gallery',
    scheduled_date: '2024-02-20',
    start_time: '10:00',
    end_time: '14:00',
    status: 'approved',
    teacher_id: 'teacher-2',
    venue_id: 'venue-2',
    experience_id: 'exp-2',
    student_count: 20,
    chaperone_count: 2,
    estimated_cost_cents: 1500,
    special_requirements: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    teacher: {
      id: 'teacher-2',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@school.edu',
    },
    venue: {
      id: 'venue-2',
      name: 'Downtown Art Gallery',
      address: '456 Art Ave',
    },
    experience: {
      id: 'exp-2',
      title: 'Modern Art Appreciation',
      duration_minutes: 90,
    },
  },
  {
    id: 'trip-3',
    title: 'Zoo Field Trip',
    description: 'Educational visit to the zoo',
    scheduled_date: '2024-02-25',
    start_time: '08:30',
    end_time: '16:00',
    status: 'cancelled',
    teacher_id: 'teacher-1',
    venue_id: 'venue-3',
    experience_id: 'exp-3',
    student_count: 30,
    chaperone_count: 4,
    estimated_cost_cents: 3000,
    special_requirements: 'Lunch required',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    teacher: {
      id: 'teacher-1',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@school.edu',
    },
    venue: {
      id: 'venue-3',
      name: 'City Zoo',
      address: '789 Zoo Rd',
    },
    experience: {
      id: 'exp-3',
      title: 'Animal Conservation',
      duration_minutes: 180,
    },
  },
];

describe('SchoolTripList', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trip list with all trips', () => {
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Science Museum Visit')).toBeInTheDocument();
    expect(screen.getByText('Art Gallery Tour')).toBeInTheDocument();
    expect(screen.getByText('Zoo Field Trip')).toBeInTheDocument();
  });

  it('displays trip details correctly', () => {
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    // Check first trip details
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('City Science Museum')).toBeInTheDocument();
    expect(screen.getByText('February 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('25 students, 3 chaperones')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('shows correct status badges', () => {
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('displays special requirements when present', () => {
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Wheelchair accessible')).toBeInTheDocument();
    expect(screen.getByText('Lunch required')).toBeInTheDocument();
  });

  it('shows approve and reject buttons for pending trips', () => {
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    // Should have approve/reject buttons for pending trip
    const approveButtons = screen.getAllByText('Approve');
    const rejectButtons = screen.getAllByText('Reject');
    
    expect(approveButtons).toHaveLength(1); // Only pending trip
    expect(rejectButtons).toHaveLength(1);
  });

  it('does not show approve/reject buttons for non-pending trips', () => {
    const approvedTrips = mockTrips.filter(trip => trip.status === 'approved');
    
    render(
      <SchoolTripList
        trips={approvedTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    const approveButton = screen.getByText('Approve');
    await user.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith('trip-1');
  });

  it('calls onReject when reject button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    const rejectButton = screen.getByText('Reject');
    await user.click(rejectButton);

    expect(mockOnReject).toHaveBeenCalledWith('trip-1');
  });

  it('calls onView when view button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    const viewButtons = screen.getAllByText('View Details');
    await user.click(viewButtons[0]);

    expect(mockOnView).toHaveBeenCalledWith('trip-1');
  });

  it('filters trips by status', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    // Filter by approved status
    const statusFilter = screen.getByLabelText(/filter by status/i);
    await user.selectOptions(statusFilter, 'approved');

    // Should only show approved trip
    expect(screen.getByText('Art Gallery Tour')).toBeInTheDocument();
    expect(screen.queryByText('Science Museum Visit')).not.toBeInTheDocument();
    expect(screen.queryByText('Zoo Field Trip')).not.toBeInTheDocument();
  });

  it('filters trips by teacher', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    // Filter by teacher
    const teacherFilter = screen.getByLabelText(/filter by teacher/i);
    await user.selectOptions(teacherFilter, 'teacher-2');

    // Should only show Jane Doe's trip
    expect(screen.getByText('Art Gallery Tour')).toBeInTheDocument();
    expect(screen.queryByText('Science Museum Visit')).not.toBeInTheDocument();
    expect(screen.queryByText('Zoo Field Trip')).not.toBeInTheDocument();
  });

  it('searches trips by title', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search trips/i);
    await user.type(searchInput, 'museum');

    // Should only show museum trip
    expect(screen.getByText('Science Museum Visit')).toBeInTheDocument();
    expect(screen.queryByText('Art Gallery Tour')).not.toBeInTheDocument();
    expect(screen.queryByText('Zoo Field Trip')).not.toBeInTheDocument();
  });

  it('sorts trips by date', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.selectOptions(sortSelect, 'date-desc');

    // Should show trips in reverse chronological order
    const tripTitles = screen.getAllByRole('heading', { level: 3 });
    expect(tripTitles[0]).toHaveTextContent('Zoo Field Trip'); // Feb 25
    expect(tripTitles[1]).toHaveTextContent('Art Gallery Tour'); // Feb 20
    expect(tripTitles[2]).toHaveTextContent('Science Museum Visit'); // Feb 15
  });

  it('sorts trips by cost', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.selectOptions(sortSelect, 'cost-desc');

    // Should show trips in descending cost order
    const tripTitles = screen.getAllByRole('heading', { level: 3 });
    expect(tripTitles[0]).toHaveTextContent('Zoo Field Trip'); // $30.00
    expect(tripTitles[1]).toHaveTextContent('Science Museum Visit'); // $25.00
    expect(tripTitles[2]).toHaveTextContent('Art Gallery Tour'); // $15.00
  });

  it('shows empty state when no trips match filters', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search trips/i);
    await user.type(searchInput, 'nonexistent trip');

    expect(screen.getByText('No trips found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <SchoolTripList
        trips={[]}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading trips...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <SchoolTripList
        trips={[]}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
        error="Failed to load trips"
      />
    );

    expect(screen.getByText('Failed to load trips')).toBeInTheDocument();
  });

  it('clears filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    // Apply filters
    const searchInput = screen.getByPlaceholderText(/search trips/i);
    await user.type(searchInput, 'museum');
    
    const statusFilter = screen.getByLabelText(/filter by status/i);
    await user.selectOptions(statusFilter, 'approved');

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    await user.click(clearButton);

    // Should show all trips again
    expect(screen.getByText('Science Museum Visit')).toBeInTheDocument();
    expect(screen.getByText('Art Gallery Tour')).toBeInTheDocument();
    expect(screen.getByText('Zoo Field Trip')).toBeInTheDocument();
  });

  it('handles bulk actions', async () => {
    const user = userEvent.setup();
    const mockOnBulkApprove = vi.fn();
    
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
        onBulkApprove={mockOnBulkApprove}
      />
    );

    // Select multiple trips
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // Select first trip
    await user.click(checkboxes[2]); // Select third trip

    // Click bulk approve
    const bulkApproveButton = screen.getByText('Approve Selected');
    await user.click(bulkApproveButton);

    expect(mockOnBulkApprove).toHaveBeenCalledWith(['trip-1', 'trip-3']);
  });

  it('shows trip count and statistics', () => {
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('3 trips total')).toBeInTheDocument();
    expect(screen.getByText('1 pending approval')).toBeInTheDocument();
    expect(screen.getByText('1 approved')).toBeInTheDocument();
    expect(screen.getByText('1 cancelled')).toBeInTheDocument();
  });

  it('handles empty trips array', () => {
    render(
      <SchoolTripList
        trips={[]}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('No trips found')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('February 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('February 20, 2024')).toBeInTheDocument();
    expect(screen.getByText('February 25, 2024')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(
      <SchoolTripList
        trips={mockTrips}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
  });
});