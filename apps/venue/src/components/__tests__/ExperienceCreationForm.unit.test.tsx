/**
 * Unit Tests - ExperienceCreationForm Component
 * 
 * Tests the ExperienceCreationForm component functionality including:
 * - Form validation and error handling
 * - Pricing tier management
 * - Currency selection
 * - Form submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExperienceCreationForm, type ExperienceFormData } from '../ExperienceCreationForm';

// Mock the currency utilities
vi.mock('@tripslip/utils', () => ({
  getSupportedCurrencies: vi.fn(() => ['usd', 'eur', 'gbp']),
  getCurrencyConfig: vi.fn((currency: string) => {
    const configs = {
      usd: { symbol: '$', code: 'USD', name: 'US Dollar' },
      eur: { symbol: '€', code: 'EUR', name: 'Euro' },
      gbp: { symbol: '£', code: 'GBP', name: 'British Pound' },
    };
    return configs[currency as keyof typeof configs];
  }),
  formatCurrency: vi.fn((amount: number, currency: string) => `$${(amount / 100).toFixed(2)}`),
}));

describe('ExperienceCreationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required form fields', () => {
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    // Basic Information
    expect(screen.getByLabelText(/experience title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description \(english\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description \(spanish\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total capacity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    
    // Student Capacity
    expect(screen.getByLabelText(/minimum students/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum students/i)).toBeInTheDocument();
    
    // Educational Details
    expect(screen.getByLabelText(/grade levels/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subjects/i)).toBeInTheDocument();
  });

  it('displays required field indicators', () => {
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const requiredFields = screen.getAllByText('*');
    expect(requiredFields.length).toBeGreaterThan(0);
  });

  it('validates required fields on submission', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /save experience/i });
    await user.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Experience title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('At least one pricing tier is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates title length', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByLabelText(/experience title/i);
    
    // Test too short title
    await user.type(titleInput, 'Hi');
    await user.tab(); // Trigger blur
    
    await waitFor(() => {
      expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('validates description length', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const descriptionInput = screen.getByLabelText(/description \(english\)/i);
    
    // Test too short description
    await user.type(descriptionInput, 'Short desc');
    await user.tab(); // Trigger blur
    
    await waitFor(() => {
      expect(screen.getByText('Description must be at least 20 characters')).toBeInTheDocument();
    });
  });

  it('validates duration range', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const durationInput = screen.getByLabelText(/duration \(minutes\)/i);
    
    // Test too short duration
    await user.clear(durationInput);
    await user.type(durationInput, '10');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText('Duration must be at least 15 minutes')).toBeInTheDocument();
    });
    
    // Test too long duration
    await user.clear(durationInput);
    await user.type(durationInput, '500');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText('Duration cannot exceed 8 hours (480 minutes)')).toBeInTheDocument();
    });
  });

  it('validates min/max students relationship', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const minStudentsInput = screen.getByLabelText(/minimum students/i);
    const maxStudentsInput = screen.getByLabelText(/maximum students/i);
    
    // Set min > max
    await user.clear(minStudentsInput);
    await user.type(minStudentsInput, '30');
    await user.clear(maxStudentsInput);
    await user.type(maxStudentsInput, '20');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText('Maximum students cannot be less than minimum students')).toBeInTheDocument();
    });
  });

  it('shows warning when min > max students', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const minStudentsInput = screen.getByLabelText(/minimum students/i);
    const maxStudentsInput = screen.getByLabelText(/maximum students/i);
    
    await user.clear(minStudentsInput);
    await user.type(minStudentsInput, '30');
    await user.clear(maxStudentsInput);
    await user.type(maxStudentsInput, '20');
    
    await waitFor(() => {
      expect(screen.getByText('Minimum students cannot be greater than maximum students')).toBeInTheDocument();
    });
  });

  it('adds pricing tier correctly', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const addTierButton = screen.getByRole('button', { name: /add pricing tier/i });
    await user.click(addTierButton);
    
    expect(screen.getByText('Tier 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Default min students
    expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // Default max students
  });

  it('removes pricing tier correctly', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    // Add a tier first
    const addTierButton = screen.getByRole('button', { name: /add pricing tier/i });
    await user.click(addTierButton);
    
    expect(screen.getByText('Tier 1')).toBeInTheDocument();
    
    // Remove the tier
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);
    
    expect(screen.queryByText('Tier 1')).not.toBeInTheDocument();
  });

  it('updates pricing tier values', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    // Add a tier
    const addTierButton = screen.getByRole('button', { name: /add pricing tier/i });
    await user.click(addTierButton);
    
    // Update price
    const priceInput = screen.getByDisplayValue('0'); // Default price
    await user.clear(priceInput);
    await user.type(priceInput, '2500'); // $25.00
    
    expect(screen.getByDisplayValue('2500')).toBeInTheDocument();
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByLabelText(/experience title/i);
    
    // Trigger validation error
    await user.tab(); // Blur without typing
    
    await waitFor(() => {
      expect(screen.getByText('Experience title is required')).toBeInTheDocument();
    });
    
    // Start typing - error should clear
    await user.type(titleInput, 'New Experience');
    
    await waitFor(() => {
      expect(screen.queryByText('Experience title is required')).not.toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/experience title/i), 'Test Experience');
    await user.type(screen.getByLabelText(/description \(english\)/i), 'This is a detailed description of the experience that is long enough to pass validation.');
    
    // Add pricing tier
    const addTierButton = screen.getByRole('button', { name: /add pricing tier/i });
    await user.click(addTierButton);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save experience/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Experience',
          description: 'This is a detailed description of the experience that is long enough to pass validation.',
          pricing_tiers: expect.arrayContaining([
            expect.objectContaining({
              min_students: 10,
              max_students: 30,
              price_cents: 0,
              free_chaperones: 2,
            })
          ])
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form when submitting', () => {
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} isSubmitting={true} />);
    
    const submitButton = screen.getByRole('button', { name: /saving.../i });
    expect(submitButton).toBeDisabled();
  });

  it('populates form with initial data', () => {
    const initialData: Partial<ExperienceFormData> = {
      title: 'Existing Experience',
      description: 'Existing description that is long enough',
      duration_minutes: 90,
      capacity: 50,
      min_students: 15,
      max_students: 40,
      currency: 'eur',
      pricing_tiers: [
        {
          min_students: 15,
          max_students: 25,
          price_cents: 2000,
          free_chaperones: 3,
        }
      ]
    };
    
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} initialData={initialData} />);
    
    expect(screen.getByDisplayValue('Existing Experience')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description that is long enough')).toBeInTheDocument();
    expect(screen.getByDisplayValue('90')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();
    expect(screen.getByDisplayValue('eur')).toBeInTheDocument();
    expect(screen.getByText('Tier 1')).toBeInTheDocument();
  });

  it('displays currency options correctly', () => {
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const currencySelect = screen.getByLabelText(/currency/i);
    expect(currencySelect).toBeInTheDocument();
    
    // Check that options are rendered (they're in a select element)
    expect(screen.getByDisplayValue('usd')).toBeInTheDocument();
  });

  it('validates capacity minimum value', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    const capacityInput = screen.getByLabelText(/total capacity/i);
    
    await user.clear(capacityInput);
    await user.type(capacityInput, '0');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText('Capacity must be at least 1 student')).toBeInTheDocument();
    });
  });

  it('handles Spanish description as optional field', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    // Fill required fields but leave Spanish description empty
    await user.type(screen.getByLabelText(/experience title/i), 'Test Experience');
    await user.type(screen.getByLabelText(/description \(english\)/i), 'This is a detailed description of the experience that is long enough to pass validation.');
    
    // Add pricing tier
    const addTierButton = screen.getByRole('button', { name: /add pricing tier/i });
    await user.click(addTierButton);
    
    // Submit form - should succeed without Spanish description
    const submitButton = screen.getByRole('button', { name: /save experience/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('clears pricing tier error when tier is added', async () => {
    const user = userEvent.setup();
    render(<ExperienceCreationForm onSubmit={mockOnSubmit} />);
    
    // Try to submit without pricing tiers to trigger error
    const submitButton = screen.getByRole('button', { name: /save experience/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('At least one pricing tier is required')).toBeInTheDocument();
    });
    
    // Add pricing tier - error should clear
    const addTierButton = screen.getByRole('button', { name: /add pricing tier/i });
    await user.click(addTierButton);
    
    await waitFor(() => {
      expect(screen.queryByText('At least one pricing tier is required')).not.toBeInTheDocument();
    });
  });
});