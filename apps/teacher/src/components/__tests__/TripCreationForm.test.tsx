import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TripCreationForm, TripFormData } from '../TripCreationForm';

// Mock UI components
vi.mock('@tripslip/ui/components/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props} data-testid="button">
      {children}
    </button>
  ),
}));

vi.mock('@tripslip/ui/components/input', () => ({
  Input: ({ ...props }: any) => <input {...props} data-testid="input" />,
}));

vi.mock('@tripslip/ui/components/label', () => ({
  Label: ({ children, ...props }: any) => (
    <label {...props} data-testid="label">
      {children}
    </label>
  ),
}));

vi.mock('@tripslip/ui/components/textarea', () => ({
  Textarea: ({ ...props }: any) => <textarea {...props} data-testid="textarea" />,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
}));

describe('TripCreationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to ensure consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all form fields', () => {
    render(<TripCreationForm {...defaultProps} />);

    expect(screen.getByLabelText(/trip name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trip date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trip time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/special requirements/i)).toBeInTheDocument();
  });

  it('displays venue and experience information when provided', () => {
    render(
      <TripCreationForm 
        {...defaultProps} 
        venueName="Science Museum"
        experienceName="Space Exploration"
      />
    );

    expect(screen.getByText('Science Museum')).toBeInTheDocument();
    expect(screen.getByText('Space Exploration')).toBeInTheDocument();
    expect(screen.getByText(/venue:/i)).toBeInTheDocument();
    expect(screen.getByText(/experience:/i)).toBeInTheDocument();
  });

  it('initializes form with provided initial data', () => {
    const initialData = {
      name: 'Test Trip',
      date: '2024-02-01',
      time: '10:00',
      description: 'Test description',
      specialRequirements: 'Test requirements',
    };

    render(<TripCreationForm {...defaultProps} initialData={initialData} />);

    expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test requirements')).toBeInTheDocument();
  });

  it('validates required fields on submission', async () => {
    render(<TripCreationForm {...defaultProps} />);

    const submitButton = screen.getByText('Create Trip');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Trip name is required')).toBeInTheDocument();
      expect(screen.getByText('Trip date is required')).toBeInTheDocument();
      expect(screen.getByText('Trip time is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates trip name length', async () => {
    render(<TripCreationForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/trip name/i);
    fireEvent.change(nameInput, { target: { value: 'AB' } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText('Trip name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('validates trip date is in the future', async () => {
    render(<TripCreationForm {...defaultProps} />);

    const dateInput = screen.getByLabelText(/trip date/i);
    fireEvent.change(dateInput, { target: { value: '2023-12-31' } });
    fireEvent.blur(dateInput);

    await waitFor(() => {
      expect(screen.getByText('Trip date must be in the future')).toBeInTheDocument();
    });
  });

  it('validates trip date is at least 2 weeks in advance', async () => {
    render(<TripCreationForm {...defaultProps} />);

    const dateInput = screen.getByLabelText(/trip date/i);
    // Set date to 1 week from now (should fail validation)
    fireEvent.change(dateInput, { target: { value: '2024-01-08' } });
    fireEvent.blur(dateInput);

    await waitFor(() => {
      expect(screen.getByText('Trip date must be at least 2 weeks in the future')).toBeInTheDocument();
    });
  });

  it('accepts valid trip date (2+ weeks in future)', async () => {
    render(<TripCreationForm {...defaultProps} />);

    const dateInput = screen.getByLabelText(/trip date/i);
    // Set date to 3 weeks from now (should pass validation)
    fireEvent.change(dateInput, { target: { value: '2024-01-22' } });
    fireEvent.blur(dateInput);

    await waitFor(() => {
      expect(screen.queryByText(/trip date must be/i)).not.toBeInTheDocument();
    });
  });

  it('clears field errors when user starts typing', async () => {
    render(<TripCreationForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/trip name/i);
    
    // Trigger validation error
    fireEvent.blur(nameInput);
    await waitFor(() => {
      expect(screen.getByText('Trip name is required')).toBeInTheDocument();
    });

    // Start typing - error should clear
    fireEvent.change(nameInput, { target: { value: 'T' } });
    expect(screen.queryByText('Trip name is required')).not.toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    render(<TripCreationForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/trip name/i);
    const dateInput = screen.getByLabelText(/trip date/i);
    const timeInput = screen.getByLabelText(/trip time/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(nameInput, { target: { value: 'Science Museum Trip' } });
    fireEvent.change(dateInput, { target: { value: '2024-01-22' } });
    fireEvent.change(timeInput, { target: { value: '10:00' } });
    fireEvent.change(descriptionInput, { target: { value: 'Educational trip' } });

    const submitButton = screen.getByText('Create Trip');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Science Museum Trip',
        date: '2024-01-22',
        time: '10:00',
        venueId: undefined,
        experienceId: undefined,
        description: 'Educational trip',
        specialRequirements: '',
      });
    });
  });

  it('shows loading state during submission', () => {
    render(<TripCreationForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByText('Creating Trip...')).toBeInTheDocument();
    
    const submitButton = screen.getByText('Creating Trip...');
    expect(submitButton).toBeDisabled();

    // All inputs should be disabled
    const inputs = screen.getAllByTestId('input');
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<TripCreationForm {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('does not render cancel button when onCancel is not provided', () => {
    render(<TripCreationForm onSubmit={mockOnSubmit} />);

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('sets minimum date attribute correctly', () => {
    render(<TripCreationForm {...defaultProps} />);

    const dateInput = screen.getByLabelText(/trip date/i);
    expect(dateInput).toHaveAttribute('min', '2024-01-15'); // 2 weeks from 2024-01-01
  });

  it('displays help text for date field', () => {
    render(<TripCreationForm {...defaultProps} />);

    expect(screen.getByText('Trip must be scheduled at least 2 weeks in advance')).toBeInTheDocument();
  });

  it('handles form submission with async onSubmit', async () => {
    const asyncOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TripCreationForm {...defaultProps} onSubmit={asyncOnSubmit} />);

    const nameInput = screen.getByLabelText(/trip name/i);
    const dateInput = screen.getByLabelText(/trip date/i);
    const timeInput = screen.getByLabelText(/trip time/i);

    fireEvent.change(nameInput, { target: { value: 'Test Trip' } });
    fireEvent.change(dateInput, { target: { value: '2024-01-22' } });
    fireEvent.change(timeInput, { target: { value: '10:00' } });

    const submitButton = screen.getByText('Create Trip');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(asyncOnSubmit).toHaveBeenCalled();
    });
  });

  it('includes venue and experience IDs in form data when provided', async () => {
    const initialData = {
      venueId: 'venue-123',
      experienceId: 'experience-456',
    };

    render(<TripCreationForm {...defaultProps} initialData={initialData} />);

    const nameInput = screen.getByLabelText(/trip name/i);
    const dateInput = screen.getByLabelText(/trip date/i);
    const timeInput = screen.getByLabelText(/trip time/i);

    fireEvent.change(nameInput, { target: { value: 'Test Trip' } });
    fireEvent.change(dateInput, { target: { value: '2024-01-22' } });
    fireEvent.change(timeInput, { target: { value: '10:00' } });

    const submitButton = screen.getByText('Create Trip');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          venueId: 'venue-123',
          experienceId: 'experience-456',
        })
      );
    });
  });

  it('displays error icons for invalid fields', async () => {
    render(<TripCreationForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/trip name/i);
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
  });

  it('applies correct ARIA attributes for accessibility', () => {
    render(<TripCreationForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/trip name/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');

    // Trigger error state
    fireEvent.blur(nameInput);
    
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
  });

  it('prevents form submission when validation fails', async () => {
    render(<TripCreationForm {...defaultProps} />);

    // Fill only name, leave date and time empty
    const nameInput = screen.getByLabelText(/trip name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Trip' } });

    const submitButton = screen.getByText('Create Trip');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Trip date is required')).toBeInTheDocument();
      expect(screen.getByText('Trip time is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});