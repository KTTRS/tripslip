/**
 * Venue Booking Service
 * 
 * Provides functionality for managing venue bookings and data sharing consents.
 * Supports booking creation, status management, and privacy-aware roster sharing.
 * 
 * Requirements: 11.1, 11.3, 12.1, 12.2, 12.3, 12.4, 12.5, 25.1, 25.2, 25.3
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// Types and Interfaces
// =====================================================

export type BookingStatus = 'pending' | 'confirmed' | 'modified' | 'cancelled' | 'completed';

export interface VenueBooking {
  id: string;
  trip_id: string;
  venue_id: string;
  experience_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  student_count: number;
  chaperone_count: number;
  status: BookingStatus;
  confirmation_number: string;
  quoted_price_cents: number;
  deposit_cents: number | null;
  paid_cents: number;
  special_requirements: string | null;
  venue_notes: string | null;
  internal_notes: string | null;
  requested_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingInput {
  trip_id: string;
  venue_id: string;
  experience_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  student_count: number;
  chaperone_count?: number;
  quoted_price_cents: number;
  deposit_cents?: number;
  special_requirements?: string;
}

export interface UpdateBookingInput {
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  student_count?: number;
  chaperone_count?: number;
  special_requirements?: string;
  venue_notes?: string;
  internal_notes?: string;
}

export interface ConfirmBookingInput {
  venue_notes?: string;
}

export interface CancelBookingInput {
  reason?: string;
}

export interface DataSharingConsent {
  id: string;
  student_id: string;
  parent_id: string;
  booking_id: string;
  share_basic_info: boolean;
  share_medical_info: boolean;
  share_contact_info: boolean;
  share_emergency_info: boolean;
  consented_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConsentInput {
  student_id: string;
  parent_id: string;
  booking_id: string;
  share_basic_info?: boolean;
  share_medical_info?: boolean;
  share_contact_info?: boolean;
  share_emergency_info?: boolean;
}

export interface UpdateConsentInput {
  share_basic_info?: boolean;
  share_medical_info?: boolean;
  share_contact_info?: boolean;
  share_emergency_info?: boolean;
}

export interface BookingWithDetails extends VenueBooking {
  venue_name?: string;
  experience_title?: string;
  teacher_name?: string;
  school_name?: string;
}

export interface SharedStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  age?: number;
  grade_level?: string;
  medical_info?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  dietary_restrictions?: string[];
  accessibility_needs?: string[];
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
}

export interface SharedRosterData {
  booking_id: string;
  venue_id: string;
  students: SharedStudent[];
  consented_student_count: number;
  total_student_count: number;
  shared_at: string;
}

// =====================================================
// Venue Booking Service
// =====================================================

// Valid status transitions for booking state machine
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'modified'],
  modified: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

export class VenueBookingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Validate status transition according to state machine rules
   * @throws Error if transition is invalid
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: string
  ): void {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
  /**
   * Generate a unique confirmation number for a booking
   * Format: BK-{timestamp}-{random}
   * Example: BK-L8X9K2P-A7B3C9
   */
  private generateConfirmationNumber(): string {
      // Format: VB-YYYYMMDD-XXXX where XXXX is alphanumeric
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 chars
      return `VB-${dateStr}-${random}`;
    }

  /**
   * Create a new venue booking
   */
  async createBooking(input: CreateBookingInput): Promise<VenueBooking> {
      // Check availability before creating booking
      const availability = await this.checkAvailability(
        input.venue_id,
        input.experience_id,
        input.scheduled_date,
        input.start_time,
        input.end_time,
        input.student_count
      );

      if (!availability.available) {
        throw new Error(availability.reason || 'Booking not available');
      }

      const confirmationNumber = this.generateConfirmationNumber();

      const { data, error } = await this.supabase
        .from('venue_bookings')
        .insert({
          trip_id: input.trip_id,
          venue_id: input.venue_id,
          experience_id: input.experience_id,
          scheduled_date: input.scheduled_date,
          start_time: input.start_time,
          end_time: input.end_time,
          student_count: input.student_count,
          chaperone_count: input.chaperone_count || 0,
          quoted_price_cents: input.quoted_price_cents,
          deposit_cents: input.deposit_cents || null,
          special_requirements: input.special_requirements || null,
          confirmation_number: confirmationNumber,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string): Promise<VenueBooking | null> {
    const { data, error } = await this.supabase
      .from('venue_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Get booking by confirmation number
   */
  async getBookingByConfirmationNumber(confirmationNumber: string): Promise<VenueBooking | null> {
    const { data, error } = await this.supabase
      .from('venue_bookings')
      .select('*')
      .eq('confirmation_number', confirmationNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Get all bookings for a trip
   */
  async getBookingsByTripId(tripId: string): Promise<VenueBooking[]> {
    const { data, error } = await this.supabase
      .from('venue_bookings')
      .select('*')
      .eq('trip_id', tripId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all bookings for a venue
   */
  async getBookingsByVenueId(
    venueId: string,
    options?: { status?: BookingStatus; fromDate?: string; toDate?: string }
  ): Promise<VenueBooking[]> {
    let query = this.supabase
      .from('venue_bookings')
      .select('*')
      .eq('venue_id', venueId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.fromDate) {
      query = query.gte('scheduled_date', options.fromDate);
    }

    if (options?.toDate) {
      query = query.lte('scheduled_date', options.toDate);
    }

    query = query.order('scheduled_date', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Update booking details
   */
  async updateBooking(bookingId: string, input: UpdateBookingInput): Promise<VenueBooking> {
    const updates: any = { ...input };
    
    // If modifying key details, update status to 'modified'
    if (input.scheduled_date || input.start_time || input.end_time || input.student_count) {
      const booking = await this.getBookingById(bookingId);
      if (booking && booking.status === 'confirmed') {
        // Validate status transition
        this.validateStatusTransition(booking.status, 'modified');
        updates.status = 'modified';
      }
    }

    const { data, error } = await this.supabase
      .from('venue_bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Confirm a booking (venue action)
   */
  async confirmBooking(bookingId: string, input?: ConfirmBookingInput): Promise<VenueBooking> {
    // Get current booking to validate transition
    const currentBooking = await this.getBookingById(bookingId);
    if (!currentBooking) {
      throw new Error('Booking not found');
    }

    // Validate status transition
    this.validateStatusTransition(currentBooking.status, 'confirmed');

    // Check capacity before confirming
    const remainingCapacity = await this.getRemainingCapacity(
      currentBooking.experience_id,
      currentBooking.scheduled_date,
      currentBooking.start_time,
      currentBooking.end_time
    );

    // For pending bookings, we need to check if confirming would exceed capacity
    // (the booking's student count is already included in the calculation)
    if (currentBooking.status === 'pending' && remainingCapacity < 0) {
      throw new Error('Cannot confirm booking: would exceed capacity');
    }

    const updates: any = {
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    };

    if (input?.venue_notes) {
      updates.venue_notes = input.venue_notes;
    }

    const { data, error } = await this.supabase
      .from('venue_bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, input?: CancelBookingInput): Promise<VenueBooking> {
    // Get current booking to validate transition
    const currentBooking = await this.getBookingById(bookingId);
    if (!currentBooking) {
      throw new Error('Booking not found');
    }

    // Validate status transition
    this.validateStatusTransition(currentBooking.status, 'cancelled');

    const updates: any = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    };

    if (input?.reason) {
      updates.internal_notes = input.reason;
    }

    const { data, error } = await this.supabase
      .from('venue_bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark booking as completed
   */
  async completeBooking(bookingId: string): Promise<VenueBooking> {
    // Get current booking to validate transition
    const currentBooking = await this.getBookingById(bookingId);
    if (!currentBooking) {
      throw new Error('Booking not found');
    }

    // Validate status transition
    this.validateStatusTransition(currentBooking.status, 'completed');

    const { data, error } = await this.supabase
      .from('venue_bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create or update data sharing consent
   */
  async upsertConsent(input: CreateConsentInput): Promise<DataSharingConsent> {
    const { data, error } = await this.supabase
      .from('data_sharing_consents')
      .upsert({
        student_id: input.student_id,
        parent_id: input.parent_id,
        booking_id: input.booking_id,
        share_basic_info: input.share_basic_info ?? true,
        share_medical_info: input.share_medical_info ?? false,
        share_contact_info: input.share_contact_info ?? false,
        share_emergency_info: input.share_emergency_info ?? true,
      }, {
        onConflict: 'student_id,booking_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get consent for a student and booking
   */
  async getConsent(studentId: string, bookingId: string): Promise<DataSharingConsent | null> {
    const { data, error } = await this.supabase
      .from('data_sharing_consents')
      .select('*')
      .eq('student_id', studentId)
      .eq('booking_id', bookingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Get all consents for a booking
   */
  async getConsentsByBookingId(bookingId: string): Promise<DataSharingConsent[]> {
    const { data, error } = await this.supabase
      .from('data_sharing_consents')
      .select('*')
      .eq('booking_id', bookingId)
      .is('revoked_at', null);

    if (error) throw error;
    return data || [];
  }

  /**
   * Revoke consent
   */
  async revokeConsent(studentId: string, bookingId: string): Promise<DataSharingConsent> {
    const { data, error } = await this.supabase
      .from('data_sharing_consents')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .eq('booking_id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get shared roster data for a booking (respects consent)
   * This method would typically join with students, parents, and medical info tables
   * For now, returns the structure that would be populated
   */
  async getSharedRosterData(bookingId: string): Promise<SharedRosterData> {
    // Get booking details
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get all consents for this booking
    const consents = await this.getConsentsByBookingId(bookingId);

    // In a real implementation, this would join with students, parents, and medical info
    // and filter based on consent settings
    // For now, return the structure
    return {
      booking_id: bookingId,
      venue_id: booking.venue_id,
      students: [], // Would be populated with actual student data
      consented_student_count: consents.length,
      total_student_count: booking.student_count,
      shared_at: new Date().toISOString(),
    };
  }

  /**
   * Delete a booking (soft delete by cancelling)
   */
  async deleteBooking(bookingId: string): Promise<void> {
    await this.cancelBooking(bookingId, { reason: 'Booking deleted' });
  }
  /**
   * Get remaining capacity for an experience on a specific date and time slot
   * Requirements: 9.6, 9.7
   */
  async getRemainingCapacity(
    experienceId: string,
    scheduledDate: string,
    startTime: string,
    endTime: string
  ): Promise<number> {
    // Get experience capacity
    const { data: experience, error: expError } = await this.supabase
      .from('experiences')
      .select('max_students')
      .eq('id', experienceId)
      .single();

    if (expError || !experience) {
      throw new Error('Experience not found');
    }

    const maxCapacity = experience.max_students;

    // Get confirmed bookings for this time slot (exclude cancelled)
    const { data: bookings, error: bookingError } = await this.supabase
      .from('venue_bookings')
      .select('student_count, start_time, end_time')
      .eq('experience_id', experienceId)
      .eq('scheduled_date', scheduledDate)
      .in('status', ['pending', 'confirmed', 'modified']);

    if (bookingError) {
      throw bookingError;
    }

    // Calculate booked capacity for overlapping time slots
    let bookedCapacity = 0;
    for (const booking of bookings || []) {
      // Check if time slots overlap
      const hasOverlap =
        (startTime >= booking.start_time && startTime < booking.end_time) ||
        (endTime > booking.start_time && endTime <= booking.end_time) ||
        (startTime <= booking.start_time && endTime >= booking.end_time);

      if (hasOverlap) {
        bookedCapacity += booking.student_count;
      }
    }

    return maxCapacity - bookedCapacity;
  }

  // =====================================================
  // Booking Workflow Logic (Task 12.3)
  // =====================================================

  /**
   * Check availability for a venue/experience on a specific date and time
   * Requirements: 9.1, 9.2, 9.3, 9.6, 9.7
   */
  async checkAvailability(
    venueId: string,
    experienceId: string,
    scheduledDate: string,
    startTime: string,
    endTime: string,
    requestedCapacity: number
  ): Promise<{
    available: boolean;
    remainingCapacity: number;
    reason?: string;
  }> {
    // Get the experience to check capacity limits
    const { data: experience, error: expError } = await this.supabase
      .from('experiences')
      .select('min_students, max_students, active, published')
      .eq('id', experienceId)
      .eq('venue_id', venueId)
      .single();

    if (expError || !experience) {
      return {
        available: false,
        remainingCapacity: 0,
        reason: 'Experience not found',
      };
    }

    // Check if experience is active and published
    if (!experience.active || !experience.published) {
      return {
        available: false,
        remainingCapacity: 0,
        reason: 'Experience is not available for booking',
      };
    }

    // Check if requested capacity is within experience limits (only if actually requesting capacity)
    if (requestedCapacity > 0) {
      if (requestedCapacity < experience.min_students) {
        return {
          available: false,
          remainingCapacity: 0,
          reason: `Minimum group size is ${experience.min_students}`,
        };
      }

      if (requestedCapacity > experience.max_students) {
        return {
          available: false,
          remainingCapacity: 0,
          reason: `Maximum group size is ${experience.max_students}`,
        };
      }
    }

    // Check if the date is blocked in the availability table
    const { data: availabilityRecord, error: availError } = await this.supabase
      .from('availability')
      .select('capacity, booked_count')
      .eq('experience_id', experienceId)
      .eq('available_date', scheduledDate)
      .maybeSingle();

    if (availError) {
      throw availError;
    }

    // If availability record exists and capacity is 0, the date is blocked
    if (availabilityRecord && availabilityRecord.capacity === 0) {
      return {
        available: false,
        remainingCapacity: 0,
        reason: 'This date is blocked and unavailable for bookings',
      };
    }

    // Get existing bookings for this venue/experience on the same date and time
    const { data: existingBookings, error: bookingError } = await this.supabase
      .from('venue_bookings')
      .select('student_count, start_time, end_time')
      .eq('venue_id', venueId)
      .eq('experience_id', experienceId)
      .eq('scheduled_date', scheduledDate)
      .in('status', ['pending', 'confirmed', 'modified']);

    if (bookingError) {
      throw bookingError;
    }

    // Check for time slot conflicts and calculate remaining capacity
    let conflictingCapacity = 0;
    const requestStart = startTime;
    const requestEnd = endTime;

    for (const booking of existingBookings || []) {
      // Check if time slots overlap
      const bookingStart = booking.start_time;
      const bookingEnd = booking.end_time;

      const hasOverlap =
        (requestStart >= bookingStart && requestStart < bookingEnd) ||
        (requestEnd > bookingStart && requestEnd <= bookingEnd) ||
        (requestStart <= bookingStart && requestEnd >= bookingEnd);

      if (hasOverlap) {
        conflictingCapacity += booking.student_count;
      }
    }

    // Calculate remaining capacity
    const maxCapacity = experience.max_students;
    const remainingCapacity = maxCapacity - conflictingCapacity;

    // Check if there's enough capacity
    if (remainingCapacity < requestedCapacity) {
      return {
        available: false,
        remainingCapacity,
        reason: `Insufficient capacity. Only ${remainingCapacity} spots available.`,
      };
    }

    return {
      available: true,
      remainingCapacity: remainingCapacity - requestedCapacity,
    };
  }

  /**
   * Create a booking with availability checking
   * Requirements: 9.6, 9.7
   */
  async createBookingWithAvailabilityCheck(
    input: CreateBookingInput
  ): Promise<{ booking?: VenueBooking; error?: string }> {
    // Check availability first
    const availability = await this.checkAvailability(
      input.venue_id,
      input.experience_id,
      input.scheduled_date,
      input.start_time,
      input.end_time,
      input.student_count
    );

    if (!availability.available) {
      return {
        error: availability.reason || 'Booking not available',
      };
    }

    // Create the booking
    try {
      const booking = await this.createBooking(input);
      return { booking };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create booking',
      };
    }
  }

  /**
   * Modify an existing booking with availability checking
   * Requirements: 9.6, 9.7
   */
  async modifyBookingWithAvailabilityCheck(
    bookingId: string,
    input: UpdateBookingInput
  ): Promise<{ booking?: VenueBooking; error?: string }> {
    // Get the current booking
    const currentBooking = await this.getBookingById(bookingId);
    if (!currentBooking) {
      return { error: 'Booking not found' };
    }

    // If date/time/capacity is being changed, check availability
    const isDateTimeChange =
      input.scheduled_date || input.start_time || input.end_time || input.student_count;

    if (isDateTimeChange) {
      const scheduledDate = input.scheduled_date || currentBooking.scheduled_date;
      const startTime = input.start_time || currentBooking.start_time;
      const endTime = input.end_time || currentBooking.end_time;
      const studentCount = input.student_count || currentBooking.student_count;

      // Check availability (excluding current booking)
      const { data: existingBookings, error: bookingError } = await this.supabase
        .from('venue_bookings')
        .select('student_count, start_time, end_time')
        .eq('venue_id', currentBooking.venue_id)
        .eq('experience_id', currentBooking.experience_id)
        .eq('scheduled_date', scheduledDate)
        .neq('id', bookingId)
        .in('status', ['pending', 'confirmed', 'modified']);

      if (bookingError) {
        return { error: 'Failed to check availability' };
      }

      // Get experience capacity
      const { data: experience } = await this.supabase
        .from('experiences')
        .select('max_students, min_students')
        .eq('id', currentBooking.experience_id)
        .single();

      if (!experience) {
        return { error: 'Experience not found' };
      }

      // Check group size limits
      if (studentCount < experience.min_students) {
        return {
          error: `Minimum group size is ${experience.min_students}`,
        };
      }

      if (studentCount > experience.max_students) {
        return {
          error: `Maximum group size is ${experience.max_students}`,
        };
      }

      // Check for conflicts
      let conflictingCapacity = 0;
      for (const booking of existingBookings || []) {
        const hasOverlap =
          (startTime >= booking.start_time && startTime < booking.end_time) ||
          (endTime > booking.start_time && endTime <= booking.end_time) ||
          (startTime <= booking.start_time && endTime >= booking.end_time);

        if (hasOverlap) {
          conflictingCapacity += booking.student_count;
        }
      }

      const remainingCapacity = experience.max_students - conflictingCapacity;
      if (remainingCapacity < studentCount) {
        return {
          error: `Insufficient capacity. Only ${remainingCapacity} spots available.`,
        };
      }
    }

    // Update the booking
    try {
      const booking = await this.updateBooking(bookingId, input);
      return { booking };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to update booking',
      };
    }
  }

  /**
   * Calculate refund amount based on cancellation policy
   * Requirements: 2.8, 9.8
   */
  async calculateRefund(bookingId: string): Promise<{
    refundAmountCents: number;
    refundPercentage: number;
    reason: string;
  }> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get the experience cancellation policy
    const { data: experience, error } = await this.supabase
      .from('experiences')
      .select('cancellation_policy')
      .eq('id', booking.experience_id)
      .single();

    if (error || !experience) {
      throw new Error('Experience not found');
    }

    const policy = experience.cancellation_policy as {
      fullRefundDays: number;
      partialRefundDays: number;
      partialRefundPercent: number;
      noRefundAfterDays: number;
    };

    // Calculate days until trip
    const scheduledDate = new Date(booking.scheduled_date);
    const today = new Date();
    const daysUntilTrip = Math.ceil(
      (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine refund based on policy
    let refundPercentage = 0;
    let reason = '';

    if (daysUntilTrip >= policy.fullRefundDays) {
      refundPercentage = 100;
      reason = `Full refund: Cancelled ${daysUntilTrip} days before trip (${policy.fullRefundDays}+ days required)`;
    } else if (daysUntilTrip >= policy.partialRefundDays) {
      refundPercentage = policy.partialRefundPercent;
      reason = `Partial refund (${refundPercentage}%): Cancelled ${daysUntilTrip} days before trip`;
    } else if (daysUntilTrip >= policy.noRefundAfterDays) {
      refundPercentage = policy.partialRefundPercent;
      reason = `Partial refund (${refundPercentage}%): Cancelled ${daysUntilTrip} days before trip`;
    } else {
      refundPercentage = 0;
      reason = `No refund: Cancelled ${daysUntilTrip} days before trip (less than ${policy.noRefundAfterDays} days)`;
    }

    const refundAmountCents = Math.floor(
      (booking.quoted_price_cents * refundPercentage) / 100
    );

    return {
      refundAmountCents,
      refundPercentage,
      reason,
    };
  }

  /**
   * Cancel a booking with refund calculation
   * Requirements: 2.8, 9.8
   */
  async cancelBookingWithRefund(
    bookingId: string,
    input?: CancelBookingInput
  ): Promise<{
    booking: VenueBooking;
    refund: {
      refundAmountCents: number;
      refundPercentage: number;
      reason: string;
    };
  }> {
    // Calculate refund
    const refund = await this.calculateRefund(bookingId);

    // Cancel the booking
    const booking = await this.cancelBooking(bookingId, input);

    return {
      booking,
      refund,
    };
  }

  /**
   * Get available time slots for a venue/experience on a specific date
   * Requirements: 9.1, 9.6, 9.7
   */
  async getAvailableTimeSlots(
    venueId: string,
    experienceId: string,
    scheduledDate: string,
    requestedCapacity: number
  ): Promise<
    Array<{
      startTime: string;
      endTime: string;
      availableCapacity: number;
    }>
  > {
    // Get the experience details
    const { data: experience } = await this.supabase
      .from('experiences')
      .select('duration_minutes, max_students, active, published')
      .eq('id', experienceId)
      .eq('venue_id', venueId)
      .single();

    if (!experience || !experience.active || !experience.published) {
      return [];
    }

    // Get existing bookings for this date
    const { data: existingBookings } = await this.supabase
      .from('venue_bookings')
      .select('start_time, end_time, student_count')
      .eq('venue_id', venueId)
      .eq('experience_id', experienceId)
      .eq('scheduled_date', scheduledDate)
      .in('status', ['pending', 'confirmed', 'modified']);

    // Generate potential time slots (e.g., every hour from 9 AM to 5 PM)
    const slots: Array<{
      startTime: string;
      endTime: string;
      availableCapacity: number;
    }> = [];

    const durationMinutes = experience.duration_minutes || 60;
    const maxCapacity = experience.max_students;

    // Generate hourly slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endHour = Math.floor(hour + durationMinutes / 60);
      const endMinute = (durationMinutes % 60);
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;

      // Calculate capacity for this slot
      let usedCapacity = 0;
      for (const booking of existingBookings || []) {
        const hasOverlap =
          (startTime >= booking.start_time && startTime < booking.end_time) ||
          (endTime > booking.start_time && endTime <= booking.end_time) ||
          (startTime <= booking.start_time && endTime >= booking.end_time);

        if (hasOverlap) {
          usedCapacity += booking.student_count;
        }
      }

      const availableCapacity = maxCapacity - usedCapacity;

      // Only include slots with enough capacity
      if (availableCapacity >= requestedCapacity) {
        slots.push({
          startTime,
          endTime,
          availableCapacity,
        });
      }
    }

    return slots;
  }
}
