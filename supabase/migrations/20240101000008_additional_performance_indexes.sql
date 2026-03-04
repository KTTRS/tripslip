-- Additional performance indexes
-- Migration: 20240101000008_additional_performance_indexes.sql
-- Note: Most indexes are already created in previous migrations
-- This migration adds additional composite and specialized indexes for performance

-- =====================================================
-- ADDITIONAL COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Composite index for finding available experiences by date and capacity
CREATE INDEX idx_availability_date_capacity ON availability(available_date, capacity)
  WHERE (capacity - booked_count) > 0;

-- Composite index for finding trips by status and date
CREATE INDEX idx_trips_status_date ON trips(status, trip_date);

-- Composite index for finding pending permission slips
CREATE INDEX idx_permission_slips_trip_status ON permission_slips(trip_id, status);

-- Composite index for finding successful payments by slip
CREATE INDEX idx_payments_slip_status ON payments(permission_slip_id, status)
  WHERE status = 'succeeded';

-- Composite index for notification queries by user and read status
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, user_type, created_at)
  WHERE read_at IS NULL;

-- =====================================================
-- FULL-TEXT SEARCH INDEXES
-- =====================================================

-- Full-text search on venue names and descriptions
CREATE INDEX idx_venues_name_search ON venues USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Full-text search on experience titles and descriptions
CREATE INDEX idx_experiences_search ON experiences USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Full-text search on teacher names
CREATE INDEX idx_teachers_name_search ON teachers USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Full-text search on student names
CREATE INDEX idx_students_name_search ON students USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- =====================================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- =====================================================

-- Index for finding active (non-cancelled) trips
CREATE INDEX idx_trips_active ON trips(trip_date, experience_id)
  WHERE status != 'cancelled';

-- Index for finding paid permission slips
CREATE INDEX idx_permission_slips_paid ON permission_slips(trip_id)
  WHERE status = 'paid';

-- Index for finding pending payments
CREATE INDEX idx_payments_pending ON payments(created_at)
  WHERE status = 'pending';

-- Index for finding failed payments that need retry
CREATE INDEX idx_payments_failed ON payments(created_at)
  WHERE status = 'failed';

-- Index for finding unsent notifications
CREATE INDEX idx_notifications_unsent ON notifications(created_at)
  WHERE status = 'pending';

-- =====================================================
-- INDEXES FOR REPORTING AND ANALYTICS
-- =====================================================

-- Index for venue revenue reporting
CREATE INDEX idx_payments_venue_reporting ON payments(created_at, status)
  WHERE status = 'succeeded';

-- Index for trip attendance reporting
CREATE INDEX idx_attendance_reporting ON attendance(trip_id, present);

-- Index for audit log queries by date range
CREATE INDEX idx_audit_logs_date_range ON audit_logs(created_at DESC, table_name);

-- =====================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- =====================================================

-- Covering index for trip list queries (includes commonly selected columns)
CREATE INDEX idx_trips_list_covering ON trips(teacher_id, trip_date DESC, status)
  INCLUDE (experience_id, student_count);

-- Covering index for permission slip status queries
CREATE INDEX idx_permission_slips_status_covering ON permission_slips(trip_id, status)
  INCLUDE (student_id, signed_at);

-- =====================================================
-- NOTES
-- =====================================================

-- These indexes complement the existing indexes created in previous migrations:
-- - Core entity indexes (venues, experiences, availability, pricing_tiers)
-- - Trip and slip indexes (trips, permission_slips, documents, attendance, chaperones)
-- - Payment indexes (payments, refunds)
-- - Supporting table indexes (notifications, audit_logs)
-- - School hierarchy indexes (districts, schools, teachers, rosters, students, parents)

-- The indexes are designed to optimize:
-- 1. Common query patterns (filtering, sorting, joining)
-- 2. Full-text search for user-facing search features
-- 3. Partial indexes for specific status-based queries
-- 4. Covering indexes to avoid table lookups
-- 5. Reporting and analytics queries
