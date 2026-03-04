-- Create trip_drafts table for saving trip creation progress
-- Allows teachers to save their work and resume later

CREATE TABLE IF NOT EXISTS trip_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_teacher_draft UNIQUE(teacher_id)
);

-- Indexes for performance
CREATE INDEX idx_trip_drafts_teacher ON trip_drafts(teacher_id);
CREATE INDEX idx_trip_drafts_last_saved ON trip_drafts(last_saved_at);

-- RLS Policies
ALTER TABLE trip_drafts ENABLE ROW LEVEL SECURITY;

-- Teachers can only access their own drafts
CREATE POLICY trip_drafts_select_own
  ON trip_drafts
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY trip_drafts_insert_own
  ON trip_drafts
  FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY trip_drafts_update_own
  ON trip_drafts
  FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY trip_drafts_delete_own
  ON trip_drafts
  FOR DELETE
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE trip_drafts IS 'Stores draft trip data for teachers to resume trip creation';
COMMENT ON COLUMN trip_drafts.teacher_id IS 'Reference to the teacher who owns this draft';
COMMENT ON COLUMN trip_drafts.draft_data IS 'JSON data containing trip creation form state';
COMMENT ON COLUMN trip_drafts.last_saved_at IS 'Timestamp of last auto-save';
