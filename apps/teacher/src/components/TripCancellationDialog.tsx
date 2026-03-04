import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { TripCancellationService } from '../services/trip-cancellation-service';

interface TripCancellationDialogProps {
  tripId: string;
  tripName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancellationComplete: () => void;
}

/**
 * Dialog for confirming and executing trip cancellation
 * 
 * Displays a confirmation dialog with warnings about the cancellation process.
 * Handles the cancellation workflow including refunds and notifications.
 * 
 * Follows TripSlip design system:
 * - Yellow #F5C518 for primary actions
 * - Black #0A0A0A for text and borders
 * - Offset shadows (4px) with bounce animation
 * - Plus Jakarta Sans for body text
 * - Fraunces for headings
 */
export function TripCancellationDialog({
  tripId,
  tripName,
  open,
  onOpenChange,
  onCancellationComplete,
}: TripCancellationDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    cancelledSlipsCount: number;
    refundsInitiated: number;
    notificationsSent: number;
    errors: string[];
  } | null>(null);

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);
    setResult(null);

    try {
      const service = new TripCancellationService();
      const cancellationResult = await service.cancelTrip(tripId);

      if (cancellationResult.errors.length > 0) {
        setResult(cancellationResult);
      } else {
        setResult(cancellationResult);
        // Auto-close after 3 seconds if successful
        setTimeout(() => {
          onOpenChange(false);
          onCancellationComplete();
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel trip. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    if (!isCancelling) {
      onOpenChange(false);
      if (result && result.errors.length === 0) {
        onCancellationComplete();
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-black shadow-[8px_8px_0px_#0A0A0A] max-w-md w-full p-6 z-50"
          onEscapeKeyDown={(e) => isCancelling && e.preventDefault()}
          onPointerDownOutside={(e) => isCancelling && e.preventDefault()}
        >
          {!result ? (
            <>
              <Dialog.Title className="font-fraunces text-2xl font-bold text-black mb-4">
                Cancel Trip?
              </Dialog.Title>
              
              <Dialog.Description asChild>
                <div className="font-jakarta text-base text-black mb-6 space-y-3">
                  <p>
                    You're about to cancel <strong>{tripName}</strong>. This action will:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Mark the trip as cancelled</li>
                    <li>Cancel all permission slips</li>
                    <li>Initiate refunds for all paid slips</li>
                    <li>Send cancellation emails to all parents</li>
                  </ul>
                  <p className="text-sm text-gray-700">
                    Refunds will be processed within 5-10 business days.
                  </p>
                </div>
              </Dialog.Description>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-black rounded">
                  <p className="text-sm text-red-900 font-jakarta">{error}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isCancelling}
                  className="px-4 py-2 font-jakarta font-semibold text-black border-2 border-black bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Keep Trip
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 font-jakarta font-semibold text-black border-2 border-black bg-red-500 hover:bg-red-600 shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[4px_4px_0px_#0A0A0A] transition-all duration-200"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Trip'}
                </button>
              </div>
            </>
          ) : (
            <>
              <Dialog.Title className="font-fraunces text-2xl font-bold text-black mb-4">
                {result.errors.length === 0 ? 'Trip Cancelled' : 'Trip Cancelled with Warnings'}
              </Dialog.Title>

              <div className="font-jakarta text-base text-black mb-6 space-y-4">
                <div className="p-4 bg-green-50 border-2 border-black rounded">
                  <p className="font-semibold mb-2">Cancellation Summary:</p>
                  <ul className="space-y-1 text-sm">
                    <li>✓ {result.cancelledSlipsCount} permission slips cancelled</li>
                    <li>✓ {result.refundsInitiated} refunds initiated</li>
                    <li>✓ {result.notificationsSent} parents notified</li>
                  </ul>
                </div>

                {result.errors.length > 0 && (
                  <div className="p-4 bg-yellow-50 border-2 border-black rounded">
                    <p className="font-semibold mb-2 text-yellow-900">
                      Some issues occurred:
                    </p>
                    <ul className="space-y-1 text-sm text-yellow-900 max-h-32 overflow-y-auto">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.errors.length === 0 && (
                  <p className="text-sm text-gray-700">
                    This dialog will close automatically in a moment...
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 font-jakarta font-semibold text-black border-2 border-black bg-[#F5C518] hover:bg-[#E5B508] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
