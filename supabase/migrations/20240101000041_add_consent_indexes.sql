-- Migration: Add indexes for consent enforcement queries
-- Improves performance of consent-related queries
-- Task 6.3: Add Database Indexes

-- Add index on (student_id, booking_id) for faster consent lookups
CREATE INDEX IF NOT EXISTS idx_data_sharing_consents_student_booking
ON data_sharing_consents(student_id, booking_id);

-- Add index on student_id for faster student-based queries
CREATE INDEX IF NOT EXISTS idx_data_sharing_consents_student
ON data_sharing_consents(student_id);

-- Add index on booking_id for faster booking-based queries
CREATE INDEX IF NOT EXISTS idx_data_sharing_consents_booking
ON data_sharing_consents(booking_id);

-- Add comments
COMMENT ON INDEX idx_data_sharing_consents_student_booking IS 
'Improves performance of consent lookups by student and booking';

COMMENT ON INDEX idx_data_sharing_consents_student IS 
'Improves performance of student-based consent queries';

COMMENT ON INDEX idx_data_sharing_consents_booking IS 
'Improves performance of booking-based consent queries';
