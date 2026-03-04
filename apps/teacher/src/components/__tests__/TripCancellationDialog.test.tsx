import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TripCancellationDialog } from '../TripCancellationDialog';
import { TripCancellationService } from '../../services/trip-cancellation-service';

// Mock the service
vi.mock('../../services/trip-cancellation-service');

describe('TripCancellationDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnCancellationComplete = vi.fn();

  const defaultProps = {
    tripId: 'trip-123',
    tripName: 'Museum Field Trip',
    open: true,
    onOpenChange: mockOnOpenChange,
    onCancellationComplete: mockOnCancellationComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render confirmation dialog with trip name', () => {
    render(<TripCancellationDialog {...defaultProps} />);

    expect(screen.getByText('Cancel Trip?')).toBeInTheDocument();
    expect(screen.getByText(/Museum Field Trip/)).toBeInTheDocument();
    expect(screen.getByText(/Mark the trip as cancelled/)).toBeInTheDocument();
    expect(screen.getByText(/Cancel all permission slips/)).toBeInTheDocument();
    expect(screen.getByText(/Initiate refunds for all paid slips/)).toBeInTheDocument();
    expect(screen.getByText(/Send cancellation emails to all parents/)).toBeInTheDocument();
  });

  it('should display action buttons', () => {
    render(<TripCancellationDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Keep Trip/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel Trip/i })).toBeInTheDocument();
  });

  it('should call onOpenChange when Keep Trip is clicked', () => {
    render(<TripCancellationDialog {...defaultProps} />);

    const keepButton = screen.getByRole('button', { name: /Keep Trip/i });
    fireEvent.click(keepButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable buttons while cancelling', async () => {
    const mockCancelTrip = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        tripId: 'trip-123',
        cancelledSlipsCount: 5,
        refundsInitiated: 3,
        notificationsSent: 5,
        errors: [],
      }), 100))
    );

    vi.mocked(TripCancellationService).mockImplementation(() => ({
      cancelTrip: mockCancelTrip,
      canCancelTrip: vi.fn(),
    } as any));

    render(<TripCancellationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    fireEvent.click(cancelButton);

    // Buttons should be disabled while processing
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelling.../i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Keep Trip/i })).toBeDisabled();
    });
  });

  it('should display success result after successful cancellation', async () => {
    const mockCancelTrip = vi.fn().mockResolvedValue({
      tripId: 'trip-123',
      cancelledSlipsCount: 5,
      refundsInitiated: 3,
      notificationsSent: 5,
      errors: [],
    });

    vi.mocked(TripCancellationService).mockImplementation(() => ({
      cancelTrip: mockCancelTrip,
      canCancelTrip: vi.fn(),
    } as any));

    render(<TripCancellationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Trip Cancelled')).toBeInTheDocument();
      expect(screen.getByText(/5 permission slips cancelled/)).toBeInTheDocument();
      expect(screen.getByText(/3 refunds initiated/)).toBeInTheDocument();
      expect(screen.getByText(/5 parents notified/)).toBeInTheDocument();
    });

    expect(mockCancelTrip).toHaveBeenCalledWith('trip-123');
  });

  it('should display warnings when cancellation has errors', async () => {
    const mockCancelTrip = vi.fn().mockResolvedValue({
      tripId: 'trip-123',
      cancelledSlipsCount: 5,
      refundsInitiated: 2,
      notificationsSent: 4,
      errors: [
        'Failed to initiate refund for payment payment-1: Stripe error',
        'Failed to send notification to parent@example.com: Email service unavailable',
      ],
    });

    vi.mocked(TripCancellationService).mockImplementation(() => ({
      cancelTrip: mockCancelTrip,
      canCancelTrip: vi.fn(),
    } as any));

    render(<TripCancellationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Trip Cancelled with Warnings')).toBeInTheDocument();
      expect(screen.getByText(/Some issues occurred:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to initiate refund/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to send notification/)).toBeInTheDocument();
    });
  });

  it('should display error message when cancellation fails', async () => {
    const mockCancelTrip = vi.fn().mockRejectedValue(new Error('Trip not found'));

    vi.mocked(TripCancellationService).mockImplementation(() => ({
      cancelTrip: mockCancelTrip,
      canCancelTrip: vi.fn(),
    } as any));

    render(<TripCancellationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText(/Trip not found/)).toBeInTheDocument();
    });

    // Should still show the confirmation dialog
    expect(screen.getByText('Cancel Trip?')).toBeInTheDocument();
  });

  it('should auto-close after successful cancellation without errors', async () => {
    vi.useFakeTimers();

    const mockCancelTrip = vi.fn().mockResolvedValue({
      tripId: 'trip-123',
      cancelledSlipsCount: 5,
      refundsInitiated: 3,
      notificationsSent: 5,
      errors: [],
    });

    vi.mocked(TripCancellationService).mockImplementation(() => ({
      cancelTrip: mockCancelTrip,
      canCancelTrip: vi.fn(),
    } as any));

    render(<TripCancellationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Trip Cancelled')).toBeInTheDocument();
    });

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnCancellationComplete).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('should not auto-close when there are errors', async () => {
    vi.useFakeTimers();

    const mockCancelTrip = vi.fn().mockResolvedValue({
      tripId: 'trip-123',
      cancelledSlipsCount: 5,
      refundsInitiated: 2,
      notificationsSent: 5,
      errors: ['Some error occurred'],
    });

    vi.mocked(TripCancellationService).mockImplementation(() => ({
      cancelTrip: mockCancelTrip,
      canCancelTrip: vi.fn(),
    } as any));

    render(<TripCancellationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Trip Cancelled with Warnings')).toBeInTheDocument();
    });

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    // Should not auto-close
    expect(mockOnOpenChange).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should call onCancellationComplete when closing after successful cancellation', async () => {
    const mockCancelTrip = vi.fn().mockResolvedValue({
      tripId: 'trip-123',
      cancelledSlipsCount: 5,
      refundsInitiated: 3,
      notificationsSent: 5,
      errors: [],
    });

    vi.mocked(TripCancellationService).mockImplementation(() => ({
      cancelTrip: mockCancelTrip,
      canCancelTrip: vi.fn(),
    } as any));

    render(<TripCancellationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Trip Cancelled')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeButton);

    expect(mockOnCancellationComplete).toHaveBeenCalled();
  });

  it('should not render when open is false', () => {
    render(<TripCancellationDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Cancel Trip?')).not.toBeInTheDocument();
  });

  it('should prevent closing during cancellation process', async () => {
    const mockCancelTrip = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        tripId: 'trip-123',
        cancelledSlipsCount: 5,
        refundsInitiated: 3,
        notificationsSent: 5,
        errors: [],
      }), 100))
    );

    vi.mocked(TripCancellationService).mockImplementation(() => ({
      cancelTrip: mockCancelTrip,
      canCancelTrip: vi.fn(),
    } as any));

    render(<TripCancellationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    fireEvent.click(cancelButton);

    // Try to click Keep Trip while processing
    const keepButton = screen.getByRole('button', { name: /Keep Trip/i });
    expect(keepButton).toBeDisabled();
  });

  it('should follow TripSlip design system styling', () => {
    const { container } = render(<TripCancellationDialog {...defaultProps} />);

    // Check for design system classes
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass('border-2', 'border-black', 'bg-white');

    // Check for yellow CTA button
    const cancelButton = screen.getByRole('button', { name: /Cancel Trip/i });
    expect(cancelButton).toHaveClass('bg-red-500');
    expect(cancelButton).toHaveClass('border-2', 'border-black');
    expect(cancelButton).toHaveClass('shadow-[4px_4px_0px_#0A0A0A]');
  });
});
