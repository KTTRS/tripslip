/**
 * Unit Tests - TripCreationForm Component
 * 
 * Tests the TripCreationForm component functionality including:
 * - Form validation and error handling
 * - Date validation (2 weeks minimum)
 * - Form submission
 * - Venue/experience display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripCreationForm, type TripFormData } from '../TripCreationForm';

describe('TripCreationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to January 1, 2024
    vi.setSystemTime(new Date('2024-01-01'));
  });

  it('renders all required form fields', () => {
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/trip name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trip date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trip time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/special requirements/i)).toBeInTheDocument();
  });

  it('displays venue and experience information when provided', () => {
    render(
      <TripCreationForm 
        onSubmit={mockOnSubmit} 
        venueName="Science Museum"
        experienceName="Space Exploration"
      />
    );
    
    expect(screen.getByText('Venue:')).toBeInTheDocument();
    expect(screen.getByText('Science Museum')).toBeInTheDocument();
    expect(screen.getByText('Experience:')).toBeInTheDocument();
    expect(screen.getByText('Space Exploration')).toBeInTheDocument();
  });

  it('shows required field indicators', () => {
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const requiredFields = screen.getAllByText('*');
    expect(requiredFields.length).toBeGreaterThan(0);
  });

  it('validates required fields on submission', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /create trip/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Trip name is required')).toBeInTheDocument();
      expect(screen.getByText('Trip date is required')).toBeInTheDocument();
      expect(screen.getByText('Trip time is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates trip name length', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText(/trip name/i);
    
    // Test too short name
    await user.type(nameInput, 'Hi');
    await user.tab(); // Trigger blur
    
    await waitFor(() => {
      expect(screen.getByText('Trip name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('validates date is in the future', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const dateInput = screen.getByLabelText(/trip date/i);
    
    // Test past date
    await user.type(dateInput, '2023-12-31');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText('Trip date must be in the future')).toBeInTheDocument();
    });
  });

  it('validates date is at least 2 weeks in future', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const dateInput = screen.getByLabelText(/trip date/i);
    
    // Test date that's only 1 week in future (January 8, 2024)
    await user.type(dateInput, '2024-01-08');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText('Trip date must be at least 2 weeks in the future')).toBeInTheDocument();
    });
  });

  it('accepts valid future date', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const dateInput = screen.getByLabelText(/trip date/i);
    
    // Test date that's 3 weeks in future (January 22, 2024)
    await user.type(dateInput, '2024-01-22');
    await user.tab();
    
    // Should not show error
    await waitFor(() => {
      expect(screen.queryByText(/trip date must be/i)).not.toBeInTheDocument();
    });
  });

  it('sets minimum date attribute correctly', () => {
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const dateInput = screen.getByLabelText(/trip date/i);
    
    // Should have min attribute set to 2 weeks from current date
    expect(dateInput).toHaveAttribute('min', '2024-01-15'); // 2 weeks from Jan 1, 2024
  });

  it('shows helpful date message', () => {
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('Trip must be scheduled at least 2 weeks in advance')).toBeInTheDocument();
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText(/trip name/i);
    
    // Trigger validation error
    await user.tab(); // Blur without typing
    
    await waitFor(() => {
      expect(screen.getByText('Trip name is required')).toBeInTheDocument();
    });
    
    // Start typing - error should clear
    await user.type(nameInput, 'New Trip');
    
    await waitFor(() => {
      expect(screen.queryByText('Trip name is required')).not.toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/trip name/i), 'Science Museum Trip');
    await user.type(screen.getByLabelText(/trip date/i), '2024-01-22'); // 3 weeks in future
    await user.type(screen.getByLabelText(/trip time/i), '09:00');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create trip/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Science Museum Trip',
          date: '2024-01-22',
          time: '09:00',
          description: '',
          specialRequirements: '',
        })
      );
    });
  });

  it('includes optional fields in submission', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    // Fill all fields
    await user.type(screen.getByLabelText(/trip name/i), 'Science Museum Trip');
    await user.type(screen.getByLabelText(/trip date/i), '2024-01-22');
    await user.type(screen.getByLabelText(/trip time/i), '09:00');
    await user.type(screen.getByLabelText(/description/i), 'Educational trip to learn about space');
    await user.type(screen.getByLabelText(/special requirements/i), 'Wheelchair accessible');
    
    const submitButton = screen.getByRole('button', { name: /create trip/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Educational trip to learn about space',
          specialRequirements: 'Wheelchair accessible',
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('does not show cancel button when onCancel is not provided', () => {
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('disables form when submitting', () => {
    render(<TripCreationForm onSubmit={mockOnSubmit} isSubmitting={true} />);
    
    const submitButton = screen.getByRole('button', { name: /creating trip.../i });
    expect(submitButton).toBeDisabled();
    
    const nameInput = screen.getByLabelText(/trip name/i);
    expect(nameInput).toBeDisabled();
  });

  it('populates form with initial data', () => {
    const initialData: Partial<TripFormData> = {
      name: 'Existing Trip',
      date: '2024-02-01',
      time: '10:30',
      description: 'Existing description',
      specialRequirements: 'Existing requirements',
      venueId: 'venue-123',
      experienceId: 'exp-456',
    };
    
    render(<TripCreationForm onSubmit={mockOnSubmit} initialData={initialData} />);
    
    expect(screen.getByDisplayValue('Existing Trip')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10:30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing requirements')).toBeInTheDocument();
  });

  it('shows proper ARIA attributes for accessibility', () => {
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText(/trip name/i);
    const dateInput = screen.getByLabelText(/trip date/i);
    const timeInput = screen.getByLabelText(/trip time/i);
    
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    expect(dateInput).toHaveAttribute('aria-describedby', 'date-help');
    expect(timeInput).toHaveAttribute('aria-invalid', 'false');
  });

  it('updates ARIA attributes when validation errors occur', async () => {
    const user = userEvent.setup();
    render(<TripCreationForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText(/trip name/i);
    
    // Trigger validation error
    await user.tab(); // Blur without typing
    
    await waitFor(() => {
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
    });
  });

  it('handles form submission with async onSubmit', async () => {
    const user = userEvent.setup();
    const asyncOnSubmit = vi.fn().mockResolvedValue(undefined);
    
    render(<TripCreationForm onSubmit={asyncOnSubmit} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/trip name/i), 'Async Trip');
    await user.type(screen.getByLabelText(/trip date/i), '2024-01-22');
    await user.type(screen.getByLabelText(/trip time/i), '09:00');
    
    const submitButton = screen.getByRole('button', { name: /create trip/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(asyncOnSubmit).toHaveBeenCalled();
    });
  });

  it('preserves venue and experience IDs in form data', async () => {
    const user = userEvent.setup();
    const initialData: Partial<TripFormData> = {
      venueId: 'venue-123',
      experienceId: 'exp-456',
    };
    
    render(<TripCreationForm onSubmit={mockOnSubmit} initialData={initialData} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/trip name/i), 'Trip with IDs');
    await user.type(screen.getByLabelText(/trip date/i), '2024-01-22');
    await user.type(screen.getByLabelText(/trip time/i), '09:00');
    
    const submitButton = screen.getByRole('button', { name: /create trip/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          venueId: 'venue-123',
          experienceId: 'exp-456',
        })
      );
    });
  });
});