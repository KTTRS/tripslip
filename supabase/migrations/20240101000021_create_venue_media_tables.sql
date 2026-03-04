-- Create venue media and document tables
-- Migration: 20240101000021_create_venue_media_tables.sql
-- Requirements: 1.3, 7.1, 7.2, 7.3, 7.4

-- =====================================================
-- VENUE PHOTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT venue_photos_display_order_check CHECK (display_order >= 0)
);

-- Index for efficient venue photo queries
CREATE INDEX idx_venue_photos_venue ON venue_photos(venue_id, display_order);

-- Index for uploaded_by for audit purposes
CREATE INDEX idx_venue_photos_uploaded_by ON venue_photos(uploaded_by);

COMMENT ON TABLE venue_photos IS 'Photo gallery for venue profiles';
COMMENT ON COLUMN venue_photos.url IS 'URL to photo in Supabase Storage';
COMMENT ON COLUMN venue_photos.caption IS 'Optional caption for the photo';
COMMENT ON COLUMN venue_photos.display_order IS 'Order in which photos should be displayed (0-indexed)';
COMMENT ON COLUMN venue_photos.uploaded_by IS 'User who uploaded the photo';

-- =====================================================
-- VENUE VIDEOS
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('upload', 'youtube', 'vimeo')),
  title TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient venue video queries
CREATE INDEX idx_venue_videos_venue ON venue_videos(venue_id);

-- Index for uploaded_by for audit purposes
CREATE INDEX idx_venue_videos_uploaded_by ON venue_videos(uploaded_by);

COMMENT ON TABLE venue_videos IS 'Video content for venue profiles';
COMMENT ON COLUMN venue_videos.url IS 'URL to video file in Supabase Storage or embed URL for YouTube/Vimeo';
COMMENT ON COLUMN venue_videos.type IS 'Type of video: upload (Supabase Storage), youtube, or vimeo';
COMMENT ON COLUMN venue_videos.title IS 'Optional title for the video';
COMMENT ON COLUMN venue_videos.uploaded_by IS 'User who uploaded or added the video';

-- =====================================================
-- VENUE FORMS AND DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('permission_slip', 'waiver', 'medical', 'photo_release')),
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  required BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT venue_forms_version_check CHECK (version > 0),
  CONSTRAINT venue_forms_file_size_check CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)
);

-- Index for efficient venue form queries
CREATE INDEX idx_venue_forms_venue ON venue_forms(venue_id);

-- Index for category filtering
CREATE INDEX idx_venue_forms_category ON venue_forms(category);

-- Index for uploaded_by for audit purposes
CREATE INDEX idx_venue_forms_uploaded_by ON venue_forms(uploaded_by);

COMMENT ON TABLE venue_forms IS 'Legal documents and forms provided by venues';
COMMENT ON COLUMN venue_forms.name IS 'Display name of the form';
COMMENT ON COLUMN venue_forms.category IS 'Category of form: permission_slip, waiver, medical, or photo_release';
COMMENT ON COLUMN venue_forms.file_url IS 'URL to PDF file in Supabase Storage';
COMMENT ON COLUMN venue_forms.file_size_bytes IS 'Size of the file in bytes';
COMMENT ON COLUMN venue_forms.version IS 'Version number of the form (increments on updates)';
COMMENT ON COLUMN venue_forms.required IS 'Whether this form is required for all experiences at this venue';
COMMENT ON COLUMN venue_forms.uploaded_by IS 'User who uploaded the form';

-- =====================================================
-- EXPERIENCE FORMS LINKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS experience_forms (
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES venue_forms(id) ON DELETE CASCADE,
  required BOOLEAN NOT NULL DEFAULT true,
  
  PRIMARY KEY (experience_id, form_id)
);

-- Index for efficient experience form queries
CREATE INDEX idx_experience_forms_experience ON experience_forms(experience_id);
CREATE INDEX idx_experience_forms_form ON experience_forms(form_id);

COMMENT ON TABLE experience_forms IS 'Links venue forms to specific experiences';
COMMENT ON COLUMN experience_forms.required IS 'Whether this form is required for this specific experience';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE venue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_forms ENABLE ROW LEVEL SECURITY;

-- Venue Photos Policies
-- Anyone can view photos for active venues
CREATE POLICY "venue_photos_select_public" ON venue_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = venue_photos.venue_id
    )
  );

-- Venue employees can insert photos for their venue
CREATE POLICY "venue_photos_insert_venue_employee" ON venue_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_photos.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

-- Venue employees can update photos for their venue
CREATE POLICY "venue_photos_update_venue_employee" ON venue_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_photos.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

-- Venue employees can delete photos for their venue
CREATE POLICY "venue_photos_delete_venue_employee" ON venue_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_photos.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

-- Venue Videos Policies (same pattern as photos)
CREATE POLICY "venue_videos_select_public" ON venue_videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = venue_videos.venue_id
    )
  );

CREATE POLICY "venue_videos_insert_venue_employee" ON venue_videos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_videos.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

CREATE POLICY "venue_videos_update_venue_employee" ON venue_videos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_videos.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

CREATE POLICY "venue_videos_delete_venue_employee" ON venue_videos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_videos.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

-- Venue Forms Policies
-- Anyone can view forms for active venues
CREATE POLICY "venue_forms_select_public" ON venue_forms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = venue_forms.venue_id
    )
  );

-- Venue employees can insert forms for their venue
CREATE POLICY "venue_forms_insert_venue_employee" ON venue_forms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_forms.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

-- Venue employees can update forms for their venue
CREATE POLICY "venue_forms_update_venue_employee" ON venue_forms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_forms.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

-- Venue employees can delete forms for their venue
CREATE POLICY "venue_forms_delete_venue_employee" ON venue_forms
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_forms.venue_id
        AND venue_users.user_id = auth.uid()
        AND venue_users.role IN ('administrator', 'editor')
        
    )
  );

-- Experience Forms Policies
-- Anyone can view experience form associations
CREATE POLICY "experience_forms_select_public" ON experience_forms
  FOR SELECT
  USING (true);

-- Venue employees can manage experience form associations for their venue's experiences
CREATE POLICY "experience_forms_insert_venue_employee" ON experience_forms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM experiences e
      JOIN venue_users vu ON vu.venue_id = e.venue_id
      WHERE e.id = experience_forms.experience_id
        AND vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

CREATE POLICY "experience_forms_delete_venue_employee" ON experience_forms
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM experiences e
      JOIN venue_users vu ON vu.venue_id = e.venue_id
      WHERE e.id = experience_forms.experience_id
        AND vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );
