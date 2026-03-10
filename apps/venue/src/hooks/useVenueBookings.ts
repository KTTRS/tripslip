import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useVenue } from '../contexts/AuthContext';
import { VenueBookingService, type VenueBooking, type BookingStatus } from '@tripslip/database';

interface UseVenueBookingsOptions {
  status?: string;
  experienceId?: string;
  startDate?: string;
  endDate?: string;
}

export function useVenueBookings(options: UseVenueBookingsOptions = {}) {
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { venueId, venueLoading } = useVenue();

  const bookingService = new VenueBookingService(supabase);

  useEffect(() => {
    if (venueLoading) return;
    if (!venueId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    fetchBookings();
  }, [venueId, venueLoading, options.status, options.experienceId, options.startDate, options.endDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedBookings = await bookingService.getBookingsByVenueId(
        venueId!,
        {
          status: options.status as BookingStatus,
          fromDate: options.startDate,
          toDate: options.endDate
        }
      );

      let filteredBookings = fetchedBookings;
      if (options.experienceId) {
        filteredBookings = fetchedBookings.filter(
          booking => booking.experience_id === options.experienceId
        );
      }

      setBookings(filteredBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (bookingId: string) => {
    try {
      await bookingService.confirmBooking(bookingId);
      await fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('Error confirming booking:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to confirm booking' };
    }
  };

  const cancelBooking = async (bookingId: string, reason?: string) => {
    try {
      await bookingService.cancelBooking(bookingId, { reason });
      await fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel booking' };
    }
  };

  const updateBooking = async (bookingId: string, updates: any) => {
    try {
      await bookingService.updateBooking(bookingId, updates);
      await fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('Error updating booking:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update booking' };
    }
  };

  return { bookings, loading, error, confirmBooking, cancelBooking, updateBooking, refetch: fetchBookings };
}
