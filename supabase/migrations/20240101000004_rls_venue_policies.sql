-- Row-Level Security policies for venue access
-- Migration: 20240101000004_rls_venue_policies.sql

-- =====================================================
-- ENABLE RLS ON VENUE TABLES
-- =====================================================

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VENUES POLICIES
-- =====================================================

-- Venues: Users can view their own venue
CREATE POLICY "Users can view their own venue"
  ON venues FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = venues.id
    )
  );

-- Venues: Users can update their own venue
CREATE POLICY "Users can update their own venue"
  ON venues FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = venues.id
    )
  );

-- Venues: Users can insert their own venue (during signup)
CREATE POLICY "Users can insert their own venue"
  ON venues FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- VENUE_USERS POLICIES
-- =====================================================

-- Venue users: Users can view venue_users for their venue
CREATE POLICY "Users can view venue_users for their venue"
  ON venue_users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = venue_users.venue_id
    )
  );

-- Venue users: Users can insert venue_users for their venue
CREATE POLICY "Users can insert venue_users for their venue"
  ON venue_users FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = venue_users.venue_id
    )
    OR auth.uid() = user_id -- Allow self-insertion during signup
  );

-- Venue users: Users can update venue_users for their venue
CREATE POLICY "Users can update venue_users for their venue"
  ON venue_users FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = venue_users.venue_id
    )
  );

-- Venue users: Users can delete venue_users for their venue
CREATE POLICY "Users can delete venue_users for their venue"
  ON venue_users FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = venue_users.venue_id
    )
  );

-- =====================================================
-- EXPERIENCES POLICIES
-- =====================================================

-- Experiences: Anyone can view published experiences
CREATE POLICY "Anyone can view published experiences"
  ON experiences FOR SELECT
  USING (published = true);

-- Experiences: Venue users can view all their experiences
CREATE POLICY "Venue users can view all their experiences"
  ON experiences FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = experiences.venue_id
    )
  );

-- Experiences: Venue users can manage their experiences
CREATE POLICY "Venue users can manage their experiences"
  ON experiences FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = experiences.venue_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM venue_users WHERE venue_id = experiences.venue_id
    )
  );

-- =====================================================
-- AVAILABILITY POLICIES
-- =====================================================

-- Availability: Anyone can view availability for published experiences
CREATE POLICY "Anyone can view availability for published experiences"
  ON availability FOR SELECT
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE published = true
    )
  );

-- Availability: Venue users can view all availability for their experiences
CREATE POLICY "Venue users can view all availability for their experiences"
  ON availability FOR SELECT
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  );

-- Availability: Venue users can manage availability for their experiences
CREATE POLICY "Venue users can manage availability for their experiences"
  ON availability FOR ALL
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    experience_id IN (
      SELECT id FROM experiences WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- PRICING_TIERS POLICIES
-- =====================================================

-- Pricing tiers: Anyone can view pricing for published experiences
CREATE POLICY "Anyone can view pricing for published experiences"
  ON pricing_tiers FOR SELECT
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE published = true
    )
  );

-- Pricing tiers: Venue users can view all pricing for their experiences
CREATE POLICY "Venue users can view all pricing for their experiences"
  ON pricing_tiers FOR SELECT
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  );

-- Pricing tiers: Venue users can manage pricing for their experiences
CREATE POLICY "Venue users can manage pricing for their experiences"
  ON pricing_tiers FOR ALL
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    experience_id IN (
      SELECT id FROM experiences WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  );
