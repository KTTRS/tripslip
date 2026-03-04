import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddOnSelector, AdditionalFee } from '../AddOnSelector';

// Mock UI components
vi.mock('@tripslip/ui', () => ({
  Checkbox: ({ checked, disabled, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={() => onCheckedChange?.(!checked)}
      data-testid="addon-checkbox"
      {...props}
    />
  ),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
    i18n: { language: 'en' },
  }),
}));

describe('AddOnSelector', () => {
  const mockOnTotalChange = vi.fn();

  const sampleAddOns: AdditionalFee[] = [
    { name: 'Lunch', amountCents: 1200, required: false },
    { name: 'Transportation', amountCents: 800, required: true },
    { name: 'Souvenir', amountCents: 500, required: false },
  ];

  const defaultProps = {
    addOns: sampleAddOns,
    basePriceCents: 2000, // $20.00
    onTotalChange: mockOnTotalChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all add-ons with correct information', () => {
    render(<AddOnSelector {...defaultProps} />);

    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Souvenir')).toBeInTheDocument();

    expect(screen.getByText('$12.00')).toBeInTheDocument();
    expect(screen.getByText('$8.00')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('marks required add-ons as required and disabled', () => {
    render(<AddOnSelector {...defaultProps} />);

    const checkboxes = screen.getAllByTestId('addon-checkbox');
    const transportationCheckbox = checkboxes[1]; // Transportation is the second item

    expect(transportationCheckbox).toBeChecked();
    expect(transportationCheckbox).toBeDisabled();
    expect(screen.getByText('(Required)')).toBeInTheDocument();
  });

  it('initializes with required add-ons selected', () => {
    render(<AddOnSelector {...defaultProps} />);

    // Transportation should be selected by default (required)
    const checkboxes = screen.getAllByTestId('addon-checkbox');
    expect(checkboxes[1]).toBeChecked(); // Transportation
    expect(checkboxes[0]).not.toBeChecked(); // Lunch
    expect(checkboxes[2]).not.toBeChecked(); // Souvenir
  });

  it('calls onTotalChange with correct initial values', () => {
    render(<AddOnSelector {...defaultProps} />);

    // Should be called with base price + required add-ons
    expect(mockOnTotalChange).toHaveBeenCalledWith(
      2800, // $20.00 + $8.00 (Transportation)
      [{ name: 'Transportation', amountCents: 800, required: true }]
    );
  });

  it('updates total when optional add-ons are selected', () => {
    render(<AddOnSelector {...defaultProps} />);

    const checkboxes = screen.getAllByTestId('addon-checkbox');
    const lunchCheckbox = checkboxes[0]; // Lunch

    fireEvent.click(lunchCheckbox);

    expect(mockOnTotalChange).toHaveBeenCalledWith(
      4000, // $20.00 + $8.00 (Transportation) + $12.00 (Lunch)
      expect.arrayContaining([
        { name: 'Transportation', amountCents: 800, required: true },
        { name: 'Lunch', amountCents: 1200, required: false },
      ])
    );
  });

  it('updates total when optional add-ons are deselected', () => {
    render(<AddOnSelector {...defaultProps} />);

    const checkboxes = screen.getAllByTestId('addon-checkbox');
    const lunchCheckbox = checkboxes[0];

    // Select lunch first
    fireEvent.click(lunchCheckbox);
    vi.clearAllMocks();

    // Then deselect it
    fireEvent.click(lunchCheckbox);

    expect(mockOnTotalChange).toHaveBeenCalledWith(
      2800, // Back to base + required only
      [{ name: 'Transportation', amountCents: 800, required: true }]
    );
  });

  it('prevents deselection of required add-ons', () => {
    render(<AddOnSelector {...defaultProps} />);

    const checkboxes = screen.getAllByTestId('addon-checkbox');
    const transportationCheckbox = checkboxes[1];

    // Try to click the required checkbox
    fireEvent.click(transportationCheckbox);

    // Should still be checked and total unchanged
    expect(transportationCheckbox).toBeChecked();
    expect(mockOnTotalChange).toHaveBeenCalledTimes(1); // Only initial call
  });

  it('displays correct cost breakdown', () => {
    render(<AddOnSelector {...defaultProps} />);

    expect(screen.getByText('Cost Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Base Price')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();

    // Transportation should be shown in breakdown (required)
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('$8.00')).toBeInTheDocument();

    // Total should be displayed
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$28.00')).toBeInTheDocument();
  });

  it('updates cost breakdown when selections change', () => {
    render(<AddOnSelector {...defaultProps} />);

    const checkboxes = screen.getAllByTestId('addon-checkbox');
    const lunchCheckbox = checkboxes[0];

    fireEvent.click(lunchCheckbox);

    // Should now show lunch in the breakdown
    const lunchItems = screen.getAllByText('Lunch');
    expect(lunchItems).toHaveLength(2); // One in selector, one in breakdown

    const priceItems = screen.getAllByText('$12.00');
    expect(priceItems).toHaveLength(2); // One in selector, one in breakdown

    // Total should be updated
    expect(screen.getByText('$40.00')).toBeInTheDocument();
  });

  it('handles empty add-ons array', () => {
    const { container } = render(
      <AddOnSelector 
        addOns={[]} 
        basePriceCents={2000} 
        onTotalChange={mockOnTotalChange} 
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('formats currency correctly for different amounts', () => {
    const addOnsWithVariousPrices: AdditionalFee[] = [
      { name: 'Cheap Item', amountCents: 50, required: false }, // $0.50
      { name: 'Expensive Item', amountCents: 12345, required: false }, // $123.45
    ];

    render(
      <AddOnSelector 
        addOns={addOnsWithVariousPrices} 
        basePriceCents={1000} 
        onTotalChange={mockOnTotalChange} 
      />
    );

    expect(screen.getByText('$0.50')).toBeInTheDocument();
    expect(screen.getByText('$123.45')).toBeInTheDocument();
  });

  it('applies correct styling for selected and unselected items', () => {
    render(<AddOnSelector {...defaultProps} />);

    const labels = screen.getAllByRole('checkbox').map(checkbox => 
      checkbox.closest('label')
    );

    // Transportation (required) should have selected styling
    const transportationLabel = labels[1];
    expect(transportationLabel).toHaveClass('bg-[#F5C518]');

    // Lunch (optional, unselected) should have unselected styling
    const lunchLabel = labels[0];
    expect(lunchLabel).toHaveClass('bg-white');
  });

  it('updates styling when optional items are selected', () => {
    render(<AddOnSelector {...defaultProps} />);

    const checkboxes = screen.getAllByTestId('addon-checkbox');
    const lunchCheckbox = checkboxes[0];
    const lunchLabel = lunchCheckbox.closest('label');

    // Initially unselected
    expect(lunchLabel).toHaveClass('bg-white');

    // Select lunch
    fireEvent.click(lunchCheckbox);

    // Should now have selected styling
    expect(lunchLabel).toHaveClass('bg-[#F5C518]');
  });

  it('handles multiple selections correctly', () => {
    render(<AddOnSelector {...defaultProps} />);

    const checkboxes = screen.getAllByTestId('addon-checkbox');
    const lunchCheckbox = checkboxes[0];
    const souvenirCheckbox = checkboxes[2];

    // Select both optional items
    fireEvent.click(lunchCheckbox);
    fireEvent.click(souvenirCheckbox);

    expect(mockOnTotalChange).toHaveBeenLastCalledWith(
      4300, // $20.00 + $8.00 + $12.00 + $5.00
      expect.arrayContaining([
        { name: 'Transportation', amountCents: 800, required: true },
        { name: 'Lunch', amountCents: 1200, required: false },
        { name: 'Souvenir', amountCents: 500, required: false },
      ])
    );
  });
});