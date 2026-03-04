-- Performance Optimization Indexes
-- Created: March 4, 2026
-- Purpose: Improve query performance across all tables

-- Permission Slips Indexes
CREATE INDEX IF NOT EXISTS idx_permission_slips_student_id ON permission_slips(student_id);
CREATE INDEX IF NOT EXISTS idx_permission_slips_trip_id ON permission_slips(trip_id);
CREATE INDEX IF NOT EXISTS idx_permission_slips_status ON permission_slips(status);
CREATE INDEX IF NOT EXISTS idx_permission_slips_magic_link_token ON permission_slips(magic_link_token) WHERE magic_link_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permission_slips_trip_status ON permission_slips(trip_id, status);
CREATE INDEX IF NOT EXISTS idx_permission_slips_signed_at ON permission_slips(signed_at) WHERE signed_at IS NOT NULL;

-- Trips Indexes
CREATE INDEX IF NOT EXISTS idx_trips_teacher_id ON trips(teacher_id);
CREATE INDEX IF NOT EXISTS idx_trips_school_id ON trips(school_id);
CREATE INDEX IF NOT EXISTS idx_trips_venue_id ON trips(venue_id);
CREATE INDEX IF NOT EXISTS idx_trips_experience_id ON trips(experience_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_school_date ON trips(school_id, trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_teacher_date ON trips(teacher_id, trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_venue_date ON trips(venue_id, trip_date);

-- Students Indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_grade_level ON students(grade_level);
CREATE INDEX IF NOT EXISTS idx_students_school_grade ON students(school_id, grade_level);

-- Trip Students Indexes
CREATE INDEX IF NOT EXISTS idx_trip_students_trip_id ON trip_students(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_students_student_id ON trip_students(student_id);
CREATE INDEX IF NOT EXISTS idx_trip_students_trip_student ON trip_students(trip_id, student_id);

-- Venues Indexes
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);
CREATE INDEX IF NOT EXISTS idx_venues_city_state ON venues(city, state);
CREATE INDEX IF NOT EXISTS idx_venues_created_at ON venues(created_at);

-- Experiences Indexes
CREATE INDEX IF NOT EXISTS idx_experiences_venue_id ON experiences(venue_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_venue_status ON experiences(venue_id, status);

-- Venue Bookings Indexes
CREATE INDEX IF NOT EXISTS idx_venue_bookings_venue_id ON venue_bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_trip_id ON venue_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_status ON venue_bookings(status);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_booking_date ON venue_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_venue_date ON venue_bookings(venue_id, booking_date);

-- Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_permission_slip_id ON payments(permission_slip_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Schools Indexes
CREATE INDEX IF NOT EXISTS idx_schools_district_id ON schools(district_id) WHERE district_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);

-- Teachers Indexes
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- User Role Assignments Indexes
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_org ON user_role_assignments(organization_type, organization_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON user_role_assignments(user_id, is_active);

-- Active Role Context Indexes
CREATE INDEX IF NOT EXISTS idx_active_role_context_user_id ON active_role_context(user_id);
CREATE INDEX IF NOT EXISTS idx_active_role_context_assignment_id ON active_role_context(active_role_assignment_id);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Notification Preferences Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Email Logs Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- SMS Logs Indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient_phone ON sms_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);

-- Trip Drafts Indexes
CREATE INDEX IF NOT EXISTS idx_trip_drafts_teacher_id ON trip_drafts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_trip_drafts_created_at ON trip_drafts(created_at);
CREATE INDEX IF NOT EXISTS idx_trip_drafts_updated_at ON trip_drafts(updated_at);

-- Venue Employees Indexes
CREATE INDEX IF NOT EXISTS idx_venue_employees_venue_id ON venue_employees(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_employees_user_id ON venue_employees(user_id);

-- Reviews Indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON reviews(venue_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews');
CREATE INDEX IF NOT EXISTS idx_reviews_trip_id ON reviews(trip_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews');
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews');

-- Partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_trips_active ON trips(trip_date) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_permission_slips_pending ON permission_slips(trip_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_experiences_active ON experiences(venue_id) WHERE status = 'active';

-- Full-text search indexes (if needed)
CREATE INDEX IF NOT EXISTS idx_venues_name_trgm ON venues USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_experiences_title_trgm ON experiences USING gin(title gin_trgm_ops);

-- Analyze tables to update statistics
ANALYZE permission_slips;
ANALYZE trips;
ANALYZE students;
ANALYZE trip_students;
ANALYZE venues;
ANALYZE experiences;
ANALYZE venue_bookings;
ANALYZE payments;
ANALYZE schools;
ANALYZE teachers;
ANALYZE user_role_assignments;
ANALYZE audit_logs;

-- Add comments
COMMENT ON INDEX idx_permission_slips_trip_status IS 'Composite index for filtering permission slips by trip and status';
COMMENT ON INDEX idx_trips_school_date IS 'Composite index for school trip queries by date';
COMMENT ON INDEX idx_venue_bookings_venue_date IS 'Composite index for venue availability queries';
COMMENT ON INDEX idx_trips_active IS 'Partial index for active confirmed trips';
COMMENT ON INDEX idx_permission_slips_pending IS 'Partial index for pending permission slips';
