import { supabase } from '../lib/supabase';

/**
 * Result of trip cancellation operation
 */
export interface TripCancellationResult {
  tripId: string;
  cancelledSlipsCount: number;
  refundsInitiated: number;
  notificationsSent: number;
  errors: string[];
}

/**
 * Service for cancelling trips and initiating refunds
 * 
 * Handles the complete trip cancellation workflow:
 * 1. Update trip status to 'cancelled'
 * 2. Update all permission slip statuses to 'cancelled'
 * 3. Initiate refunds for all paid slips
 * 4. Send cancellation notifications to parents
 * 
 * @example
 * ```ts
 * const service = new TripCancellationService();
 * const result = await service.cancelTrip('trip-uuid');
 * logger.info(`Cancelled ${result.cancelledSlipsCount} slips, initiated ${result.refundsInitiated} refunds`);
 * ```
 */
export class TripCancellationService {
  /**
   * Cancel a trip and initiate refunds for all paid permission slips
   * 
   * @param tripId - UUID of the trip to cancel
   * @returns Cancellation result with counts and any errors
   * @throws Error if trip not found or already cancelled
   */
  async cancelTrip(tripId: string): Promise<TripCancellationResult> {
    const errors: string[] = [];
    let cancelledSlipsCount = 0;
    let refundsInitiated = 0;
    let notificationsSent = 0;

    // Fetch trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        status,
        trip_date,
        experience_id,
        teacher_id,
        experiences (
          id,
          name,
          venue_id
        )
      `)
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    if (trip.status === 'cancelled') {
      throw new Error('Trip is already cancelled');
    }

    if (trip.status === 'completed') {
      throw new Error('Cannot cancel a completed trip');
    }

    // Update trip status to cancelled
    const { error: updateTripError } = await supabase
      .from('trips')
      .update({ status: 'cancelled' })
      .eq('id', tripId);

    if (updateTripError) {
      throw new Error(`Failed to update trip status: ${updateTripError.message}`);
    }

    // Fetch all permission slips for this trip
    const { data: permissionSlips, error: slipsError } = await supabase
      .from('permission_slips')
      .select(`
        id,
        status,
        student_id,
        signed_by_parent_id,
        students (
          id,
          first_name,
          last_name,
          parent_id,
          parents (
            id,
            email,
            first_name,
            last_name,
            preferred_language
          )
        )
      `)
      .eq('trip_id', tripId)
      .neq('status', 'cancelled');

    if (slipsError) {
      errors.push(`Failed to fetch permission slips: ${slipsError.message}`);
      return {
        tripId,
        cancelledSlipsCount: 0,
        refundsInitiated: 0,
        notificationsSent: 0,
        errors,
      };
    }

    if (!permissionSlips || permissionSlips.length === 0) {
      // No slips to cancel, but trip is cancelled
      return {
        tripId,
        cancelledSlipsCount: 0,
        refundsInitiated: 0,
        notificationsSent: 0,
        errors: [],
      };
    }

    // Update all permission slips to cancelled
    const { error: updateSlipsError } = await supabase
      .from('permission_slips')
      .update({ status: 'cancelled' })
      .eq('trip_id', tripId)
      .neq('status', 'cancelled');

    if (updateSlipsError) {
      errors.push(`Failed to update permission slips: ${updateSlipsError.message}`);
    } else {
      cancelledSlipsCount = permissionSlips.length;
    }

    // Initiate refunds for paid slips
    const paidSlips = permissionSlips.filter(slip => slip.status === 'paid');

    for (const slip of paidSlips) {
      try {
        // Fetch payments for this slip
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('id, amount_cents, status')
          .eq('permission_slip_id', slip.id)
          .eq('status', 'succeeded');

        if (paymentsError) {
          errors.push(`Failed to fetch payments for slip ${slip.id}: ${paymentsError.message}`);
          continue;
        }

        if (!payments || payments.length === 0) {
          continue;
        }

        // Call refund Edge Function for each payment
        for (const payment of payments) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-refund`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  paymentId: payment.id,
                  reason: 'Trip cancelled',
                }),
              }
            );

            if (response.ok) {
              refundsInitiated++;
            } else {
              const errorData = await response.json();
              errors.push(`Failed to initiate refund for payment ${payment.id}: ${errorData.error || 'Unknown error'}`);
            }
          } catch (error: any) {
            errors.push(`Error initiating refund for payment ${payment.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        errors.push(`Error processing refunds for slip ${slip.id}: ${error.message}`);
      }
    }

    // Send cancellation notifications to parents
    for (const slip of permissionSlips) {
      try {
        const student = slip.students as any;
        const parent = student?.parents;

        if (!parent || !parent.email) {
          errors.push(`No parent email found for student ${student?.first_name} ${student?.last_name}`);
          continue;
        }

        const refundMessage = slip.status === 'paid'
          ? 'A full refund will be processed to your original payment method within 5-10 business days.'
          : 'No payment was made, so no refund is necessary.';

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              to: parent.email,
              templateId: 'trip_cancelled',
              templateData: {
                parentName: parent.first_name || 'Parent',
                studentName: `${student.first_name} ${student.last_name}`,
                tripName: (trip.experiences as any)?.name || 'the field trip',
                tripDate: new Date(trip.trip_date).toLocaleDateString(),
                refundMessage,
              },
              language: parent.preferred_language || 'en',
            }),
          }
        );

        if (response.ok) {
          notificationsSent++;
        } else {
          const errorData = await response.json();
          errors.push(`Failed to send notification to ${parent.email}: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error: any) {
        errors.push(`Error sending notification for slip ${slip.id}: ${error.message}`);
      }
    }

    return {
      tripId,
      cancelledSlipsCount,
      refundsInitiated,
      notificationsSent,
      errors,
    };
  }

  /**
   * Check if a trip can be cancelled
   * 
   * @param tripId - UUID of the trip to check
   * @returns True if trip can be cancelled, false otherwise
   */
  async canCancelTrip(tripId: string): Promise<{ canCancel: boolean; reason?: string }> {
    const { data: trip, error } = await supabase
      .from('trips')
      .select('id, status')
      .eq('id', tripId)
      .single();

    if (error || !trip) {
      return { canCancel: false, reason: 'Trip not found' };
    }

    if (trip.status === 'cancelled') {
      return { canCancel: false, reason: 'Trip is already cancelled' };
    }

    if (trip.status === 'completed') {
      return { canCancel: false, reason: 'Cannot cancel a completed trip' };
    }

    return { canCancel: true };
  }
}
