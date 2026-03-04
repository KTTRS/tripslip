import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCapacity, type CapacityInfo } from '@tripslip/database';

interface UseExperienceCapacityOptions {
  experienceId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  enabled?: boolean;
}

export function useExperienceCapacity({
  experienceId,
  date,
  startTime,
  endTime,
  enabled = true,
}: UseExperienceCapacityOptions) {
  const [capacityInfo, setCapacityInfo] = useState<CapacityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !experienceId || !date) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchCapacity() {
      try {
        setLoading(true);
        setError(null);

        // Get experience capacity
        const { data: experience, error: expError } = await supabase
          .from('experiences')
          .select('max_students')
          .eq('id', experienceId)
          .single();

        if (expError) throw expError;
        if (!experience) throw new Error('Experience not found');

        // Get bookings for this date
        let query = supabase
          .from('venue_bookings')
          .select('student_count, start_time, end_time')
          .eq('experience_id', experienceId)
          .eq('scheduled_date', date)
          .in('status', ['pending', 'confirmed', 'modified']);

        const { data: bookings, error: bookingError } = await query;

        if (bookingError) throw bookingError;

        // Calculate booked count
        let bookedCount = 0;
        
        if (startTime && endTime) {
          // Filter by time slot overlap
          for (const booking of bookings || []) {
            const hasOverlap =
              (startTime >= booking.start_time && startTime < booking.end_time) ||
              (endTime > booking.start_time && endTime <= booking.end_time) ||
              (startTime <= booking.start_time && endTime >= booking.end_time);

            if (hasOverlap) {
              bookedCount += booking.student_count;
            }
          }
        } else {
          // Sum all bookings for the day
          bookedCount = (bookings || []).reduce(
            (sum, booking) => sum + booking.student_count,
            0
          );
        }

        if (isMounted) {
          const capacity = calculateCapacity(experience.max_students, bookedCount);
          setCapacityInfo(capacity);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch capacity');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCapacity();

    return () => {
      isMounted = false;
    };
  }, [supabase, experienceId, date, startTime, endTime, enabled]);

  return { capacityInfo, loading, error };
}
