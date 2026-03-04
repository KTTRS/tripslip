import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvailabilityManager } from '../AvailabilityManager';
import { createSupabaseClient } from '@tripslip/database';

// Mock Supabase client
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(),
}));

describe('AvailabilityManager', () => {
  const mockExperienceId = 'test-experience-id';
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a fresh mock for each test
    mockSupabase = {
      from: vi.fn(),
    };
    
    (createSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  describe('Component Rendering', () => {
    it('should render the component with title', async () => {
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

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText('Availability Management')).toBeInTheDocument();
      });
    });

    it('should display empty state when no dates configured', async () => {
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

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText('No availability dates configured')).toBeInTheDocument();
      });
    });
  });

  describe('Display Availability Dates', () => {
    it('should display existing availability dates', async () => {
      const mockDates = [
        {
          id: '1',
          experience_id: mockExperienceId,
          available_date: '2024-06-15',
          start_time: '09:00',
          end_time: '15:00',
          capacity: 30,
          booked_count: 10,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDates,
              error: null,
            }),
          }),
        }),
      });

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText(/Jun/)).toBeInTheDocument();
        expect(screen.getByText('09:00 - 15:00')).toBeInTheDocument();
      });
    });

    it('should show available status for dates with capacity', async () => {
      const mockDates = [
        {
          id: '1',
          experience_id: mockExperienceId,
          available_date: '2024-06-15',
          capacity: 30,
          booked_count: 10,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDates,
              error: null,
            }),
          }),
        }),
      });

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('10 / 30')).toBeInTheDocument();
      });
    });

    it('should show blocked status for dates with zero capacity', async () => {
      const mockDates = [
        {
          id: '1',
          experience_id: mockExperienceId,
          available_date: '2024-06-15',
          capacity: 0,
          booked_count: 0,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDates,
              error: null,
            }),
          }),
        }),
      });

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText('Blocked')).toBeInTheDocument();
      });
    });

    it('should show fully booked status when capacity is reached', async () => {
      const mockDates = [
        {
          id: '1',
          experience_id: mockExperienceId,
          available_date: '2024-06-15',
          capacity: 30,
          booked_count: 30,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDates,
              error: null,
            }),
          }),
        }),
      });

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText('Fully Booked')).toBeInTheDocument();
        expect(screen.getByText('30 / 30')).toBeInTheDocument();
      });
    });
  });

  describe('Add Availability Date', () => {
    it('should show error when adding date without selecting a date', async () => {
      const user = userEvent.setup();
      
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

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText('No availability dates configured')).toBeInTheDocument();
      });

      // Try to add without date
      const addButton = screen.getByRole('button', { name: /Add Available Date/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a date')).toBeInTheDocument();
      });
    });

    it('should display button text for blocking dates when capacity is zero', async () => {
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

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText('No availability dates configured')).toBeInTheDocument();
      });

      // Change capacity to 0
      const capacityInput = screen.getByLabelText('Capacity *');
      await userEvent.clear(capacityInput);
      await userEvent.type(capacityInput, '0');

      // Button text should change
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Block Date/i })).toBeInTheDocument();
      });
    });
  });

  describe('Remove Availability Date', () => {
    it('should disable remove button for dates with bookings', async () => {
      const mockDates = [
        {
          id: '1',
          experience_id: mockExperienceId,
          available_date: '2024-06-15',
          capacity: 30,
          booked_count: 10,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDates,
              error: null,
            }),
          }),
        }),
      });

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText(/Jun/)).toBeInTheDocument();
      });

      const removeButton = screen.getByTitle('Cannot remove date with bookings');
      expect(removeButton).toBeDisabled();
    });

    it('should enable remove button for dates without bookings', async () => {
      const mockDates = [
        {
          id: '1',
          experience_id: mockExperienceId,
          available_date: '2024-06-15',
          capacity: 30,
          booked_count: 0,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDates,
              error: null,
            }),
          }),
        }),
      });

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText(/Jun/)).toBeInTheDocument();
      });

      const removeButton = screen.getByTitle('Remove date');
      expect(removeButton).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error when loading fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load availability dates/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Inputs', () => {
    it('should have all required form inputs', async () => {
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

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Date *')).toBeInTheDocument();
        expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
        expect(screen.getByLabelText('End Time')).toBeInTheDocument();
        expect(screen.getByLabelText('Capacity *')).toBeInTheDocument();
      });
    });

    it('should have default values for time inputs', async () => {
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

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        const startTimeInput = screen.getByLabelText('Start Time') as HTMLInputElement;
        const endTimeInput = screen.getByLabelText('End Time') as HTMLInputElement;
        
        expect(startTimeInput.value).toBe('09:00');
        expect(endTimeInput.value).toBe('15:00');
      });
    });

    it('should have default capacity of 30', async () => {
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

      render(<AvailabilityManager experienceId={mockExperienceId} />);

      await waitFor(() => {
        const capacityInput = screen.getByLabelText('Capacity *') as HTMLInputElement;
        expect(capacityInput.value).toBe('30');
      });
    });
  });
});
