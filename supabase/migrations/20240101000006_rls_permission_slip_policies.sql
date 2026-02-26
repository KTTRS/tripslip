-- Row-Level Security policies for permission slip access
-- Migration: 20240101000006_rls_permission_slip_policies.sql

-- =====================================================
-- ENABLE RLS ON PERMISSION SLIP TABLES
-- =====================================================

ALTER TABLE permission_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PERMISSION SLIPS POLICIES
-- =====================================================

-- Permission slips: Parents can view slips via magic link
CREATE POLICY "Parents can view slips via magic link"
  ON permission_slips FOR SELECT
  USING (
    magic_link_token IS NOT NULL
    AND magic_link_token = current_setting('app.magic_link_token', true)
    AND token_expires_at > NOW()
  );

-- Permission slips: Parents can view their children's slips
CREATE POLICY "Parents can view their children's slips"
  ON permission_slips FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM student_parents WHERE parent_id IN (
        SELECT id FROM parents WHERE user_id = auth.uid()
      )
    )
  );

-- Permission slips: Teachers can view slips for their trips
CREATE POLICY "Teachers can view slips for their trips"
  ON permission_slips FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Permission slips: Venue users can view slips for their experience trips
CREATE POLICY "Venue users can view slips for their experience trips"
  ON permission_slips FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE experience_id IN (
        SELECT id FROM experiences WHERE venue_id IN (
          SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Permission slips: Parents can update slips via magic link
CREATE POLICY "Parents can update slips via magic link"
  ON permission_slips FOR UPDATE
  USING (
    magic_link_token IS NOT NULL
    AND magic_link_token = current_setting('app.magic_link_token', true)
    AND token_expires_at > NOW()
  );

-- Permission slips: Parents can update their children's slips
CREATE POLICY "Parents can update their children's slips"
  ON permission_slips FOR UPDATE
  USING (
    student_id IN (
      SELECT student_id FROM student_parents WHERE parent_id IN (
        SELECT id FROM parents WHERE user_id = auth.uid()
      )
    )
  );

-- Permission slips: Teachers can create slips for their trips
CREATE POLICY "Teachers can create slips for their trips"
  ON permission_slips FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Permission slips: Teachers can update slips for their trips (status changes)
CREATE POLICY "Teachers can update slips for their trips"
  ON permission_slips FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

-- Documents: Parents can view documents via magic link
CREATE POLICY "Parents can view documents via magic link"
  ON documents FOR SELECT
  USING (
    permission_slip_id IN (
      SELECT id FROM permission_slips 
      WHERE magic_link_token IS NOT NULL
        AND magic_link_token = current_setting('app.magic_link_token', true)
        AND token_expires_at > NOW()
    )
  );

-- Documents: Parents can view their children's documents
CREATE POLICY "Parents can view their children's documents"
  ON documents FOR SELECT
  USING (
    permission_slip_id IN (
      SELECT id FROM permission_slips WHERE student_id IN (
        SELECT student_id FROM student_parents WHERE parent_id IN (
          SELECT id FROM parents WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Documents: Teachers can view documents for their trips
CREATE POLICY "Teachers can view documents for their trips"
  ON documents FOR SELECT
  USING (
    permission_slip_id IN (
      SELECT id FROM permission_slips WHERE trip_id IN (
        SELECT id FROM trips WHERE teacher_id IN (
          SELECT id FROM teachers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Documents: Venue users can view documents for their experience trips
CREATE POLICY "Venue users can view documents for their experience trips"
  ON documents FOR SELECT
  USING (
    permission_slip_id IN (
      SELECT id FROM permission_slips WHERE trip_id IN (
        SELECT id FROM trips WHERE experience_id IN (
          SELECT id FROM experiences WHERE venue_id IN (
            SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Documents: Parents can upload documents via magic link
CREATE POLICY "Parents can upload documents via magic link"
  ON documents FOR INSERT
  WITH CHECK (
    permission_slip_id IN (
      SELECT id FROM permission_slips 
      WHERE magic_link_token IS NOT NULL
        AND magic_link_token = current_setting('app.magic_link_token', true)
        AND token_expires_at > NOW()
    )
  );

-- Documents: Parents can upload their children's documents
CREATE POLICY "Parents can upload their children's documents"
  ON documents FOR INSERT
  WITH CHECK (
    permission_slip_id IN (
      SELECT id FROM permission_slips WHERE student_id IN (
        SELECT student_id FROM student_parents WHERE parent_id IN (
          SELECT id FROM parents WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Documents: Parents can delete their own uploaded documents
CREATE POLICY "Parents can delete their own uploaded documents"
  ON documents FOR DELETE
  USING (
    permission_slip_id IN (
      SELECT id FROM permission_slips WHERE student_id IN (
        SELECT student_id FROM student_parents WHERE parent_id IN (
          SELECT id FROM parents WHERE user_id = auth.uid()
        )
      )
    )
  );
