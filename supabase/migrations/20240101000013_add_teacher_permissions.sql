-- Add permission fields to teachers table
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS can_create_trips BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_students BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add index for active teachers (user_id not null)
CREATE INDEX IF NOT EXISTS idx_teachers_active ON teachers(school_id, user_id) WHERE user_id IS NOT NULL;

-- Update RLS policies to check if teacher is active (has user_id)
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Teachers can view their own data" ON teachers;

-- Create new policy that checks if teacher is active
CREATE POLICY "Teachers can view their own data"
ON teachers
FOR SELECT
USING (
  auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- Policy for teachers to update their own profile
DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;

CREATE POLICY "Teachers can update their own profile"
ON teachers
FOR UPDATE
USING (
  auth.uid() = user_id
  AND user_id IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- Policy for trip creation - only active teachers with permission
DROP POLICY IF EXISTS "Teachers can create trips" ON trips;

CREATE POLICY "Teachers can create trips"
ON trips
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = trips.teacher_id
    AND teachers.user_id = auth.uid()
    AND teachers.user_id IS NOT NULL
    AND teachers.can_create_trips = true
  )
);

-- Policy for trip management - only active teachers
DROP POLICY IF EXISTS "Teachers can view their own trips" ON trips;

CREATE POLICY "Teachers can view their own trips"
ON trips
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = trips.teacher_id
    AND teachers.user_id = auth.uid()
    AND teachers.user_id IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Teachers can update their own trips" ON trips;

CREATE POLICY "Teachers can update their own trips"
ON trips
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = trips.teacher_id
    AND teachers.user_id = auth.uid()
    AND teachers.user_id IS NOT NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.id = trips.teacher_id
    AND teachers.user_id = auth.uid()
    AND teachers.user_id IS NOT NULL
  )
);

-- Add comment explaining deactivation
COMMENT ON COLUMN teachers.user_id IS 'When NULL, teacher is deactivated and cannot log in';
COMMENT ON COLUMN teachers.can_create_trips IS 'Permission to create new trips';
COMMENT ON COLUMN teachers.can_manage_students IS 'Permission to manage student rosters';
