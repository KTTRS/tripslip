-- Migration: Add unique constraint to venue_category_assignments
-- Prevents duplicate category assignments to the same venue
-- Task 5.1: Add Database Constraint

-- Add unique constraint on (venue_id, category_id)
ALTER TABLE venue_category_assignments
ADD CONSTRAINT venue_category_assignments_venue_category_unique
UNIQUE (venue_id, category_id);

-- Add comment
COMMENT ON CONSTRAINT venue_category_assignments_venue_category_unique 
ON venue_category_assignments IS 
'Ensures a category can only be assigned once to a venue';
