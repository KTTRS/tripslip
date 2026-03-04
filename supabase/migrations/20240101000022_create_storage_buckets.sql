-- Create Supabase Storage buckets for venue media
-- Migration: 20240101000022_create_storage_buckets.sql
-- Requirements: 1.3, 7.1, 7.2, 7.3, 7.4

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create bucket for venue photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-photos',
  'venue-photos',
  true, -- Public bucket for venue photos
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for venue videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-videos',
  'venue-videos',
  true, -- Public bucket for venue videos
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for venue forms (PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-forms',
  'venue-forms',
  true, -- Public bucket for venue forms
  5242880, -- 5MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Venue Photos Policies
-- Anyone can view photos
CREATE POLICY "venue_photos_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'venue-photos');

-- Venue employees can upload photos for their venue
CREATE POLICY "venue_photos_insert_venue_employee" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

-- Venue employees can update photos for their venue
CREATE POLICY "venue_photos_update_venue_employee" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

-- Venue employees can delete photos for their venue
CREATE POLICY "venue_photos_delete_venue_employee" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

-- Venue Videos Policies (same pattern as photos)
CREATE POLICY "venue_videos_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'venue-videos');

CREATE POLICY "venue_videos_insert_venue_employee" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'venue-videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

CREATE POLICY "venue_videos_update_venue_employee" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'venue-videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

CREATE POLICY "venue_videos_delete_venue_employee" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'venue-videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

-- Venue Forms Policies
CREATE POLICY "venue_forms_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'venue-forms');

CREATE POLICY "venue_forms_insert_venue_employee" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'venue-forms'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

CREATE POLICY "venue_forms_update_venue_employee" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'venue-forms'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

CREATE POLICY "venue_forms_delete_venue_employee" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'venue-forms'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text
      FROM venues v
      JOIN venue_users vu ON vu.venue_id = v.id
      WHERE vu.user_id = auth.uid()
        AND vu.role IN ('administrator', 'editor')
        
    )
  );

