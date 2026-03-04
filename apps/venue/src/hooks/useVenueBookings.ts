import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();

  const bookingService = new VenueBookingService(supabase);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchBookings();
  }, [user, options.status, options.experienceId, options.startDate, options.endDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get venue_id for current user
      const { data: venueUser, error: venueError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user!.id)
        .single();

      if (venueError) throw venueError;
      if (!venueUser) throw new Error('Venue not found for user');

      // Fetch bookings using the service
      const fetchedBookings = await bookingService.getBookingsByVenueId(
        venueUser.venue_id,
        {
          status: options.status as BookingStatus,
          fromDate: options.startDate,
          toDate: options.endDate
        }
      );

      // Filter by experience if specified
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
      await fetchBookings(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error('Error confirming booking:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to confirm booking' 
      };
    }
  };

  const cancelBooking = async (bookingId: string, reason?: string) => {
    try {
      await bookingService.cancelBooking(bookingId, { reason });
      await fetchBookings(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to cancel booking' 
      };
    }
  };

  const updateBooking = async (bookingId: string, updates: any) => {
    try {
      await bookingService.updateBooking(bookingId, updates);
      await fetchBookings(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error('Error updating booking:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update booking' 
      };
    }
  };

  return {
    bookings,
    loading,
    error,
    confirmBooking,
    cancelBooking,
    updateBooking,
    refetch: fetchBookings
  };
}