-- =====================================================
-- VENUE CATEGORIES AND TAGS SYSTEM
-- Migration: 20240101000028
-- Description: Create venue categorization and tagging system
-- Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8, 28.9
-- =====================================================

-- =====================================================
-- VENUE CATEGORIES (Hierarchical)
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES venue_categories(id) ON DELETE CASCADE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for hierarchical queries
CREATE INDEX idx_venue_categories_parent ON venue_categories(parent_id);
CREATE INDEX idx_venue_categories_display_order ON venue_categories(display_order);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_venue_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_venue_categories_updated_at
  BEFORE UPDATE ON venue_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_categories_updated_at();

-- =====================================================
-- VENUE CATEGORY ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_category_assignments (
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES venue_categories(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (venue_id, category_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_venue_category_assignments_venue ON venue_category_assignments(venue_id);
CREATE INDEX idx_venue_category_assignments_category ON venue_category_assignments(category_id);

-- =====================================================
-- VENUE TAGS (Flat, non-hierarchical)
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tag name lookups
CREATE INDEX idx_venue_tags_name ON venue_tags(name);

-- =====================================================
-- VENUE TAG ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_tag_assignments (
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES venue_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (venue_id, tag_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_venue_tag_assignments_venue ON venue_tag_assignments(venue_id);
CREATE INDEX idx_venue_tag_assignments_tag ON venue_tag_assignments(tag_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all subcategories of a category (recursive)
CREATE OR REPLACE FUNCTION get_category_tree(category_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  parent_id UUID,
  level INTEGER
) AS $$
WITH RECURSIVE category_tree AS (
  -- Base case: the category itself
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    0 as level
  FROM venue_categories c
  WHERE c.id = category_id
  
  UNION ALL
  
  -- Recursive case: children of categories in the tree
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    ct.level + 1
  FROM venue_categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;
$$ LANGUAGE sql STABLE;

-- Function to get category path (breadcrumb)
CREATE OR REPLACE FUNCTION get_category_path(category_id UUID)
RETURNS TEXT AS $$
WITH RECURSIVE category_path AS (
  -- Base case: the category itself
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    c.name as path,
    1 as level
  FROM venue_categories c
  WHERE c.id = category_id
  
  UNION ALL
  
  -- Recursive case: parent categories
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    c.name || ' > ' || cp.path,
    cp.level + 1
  FROM venue_categories c
  INNER JOIN category_path cp ON c.id = cp.parent_id
)
SELECT path FROM category_path ORDER BY level DESC LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to count venues in a category (including subcategories)
CREATE OR REPLACE FUNCTION count_venues_in_category(category_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT vca.venue_id)::INTEGER
  FROM venue_category_assignments vca
  WHERE vca.category_id IN (
    SELECT id FROM get_category_tree(category_id)
  );
$$ LANGUAGE sql STABLE;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE venue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Categories: Public read, admin write
CREATE POLICY "Categories are viewable by everyone"
  ON venue_categories FOR SELECT
  USING (true);

CREATE POLICY "Categories can be created by admins"
  ON venue_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

CREATE POLICY "Categories can be updated by admins"
  ON venue_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

CREATE POLICY "Categories can be deleted by admins"
  ON venue_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
    )
  );

-- Category Assignments: Public read, venue employees can manage their venue's categories
CREATE POLICY "Category assignments are viewable by everyone"
  ON venue_category_assignments FOR SELECT
  USING (true);

CREATE POLICY "Venue employees can assign categories to their venues"
  ON venue_category_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_category_assignments.venue_id
      AND venue_users.user_id = auth.uid()
      AND venue_users.role IN ('administrator', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

CREATE POLICY "Venue employees can remove categories from their venues"
  ON venue_category_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_category_assignments.venue_id
      AND venue_users.user_id = auth.uid()
      AND venue_users.role IN ('administrator', 'editor')
    )
    OR EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

-- Tags: Public read, admin write
CREATE POLICY "Tags are viewable by everyone"
  ON venue_tags FOR SELECT
  USING (true);

CREATE POLICY "Tags can be created by admins"
  ON venue_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

CREATE POLICY "Tags can be updated by admins"
  ON venue_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

CREATE POLICY "Tags can be deleted by admins"
  ON venue_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

-- Tag Assignments: Public read, venue employees can manage their venue's tags
CREATE POLICY "Tag assignments are viewable by everyone"
  ON venue_tag_assignments FOR SELECT
  USING (true);

CREATE POLICY "Venue employees can assign tags to their venues"
  ON venue_tag_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_tag_assignments.venue_id
      AND venue_users.user_id = auth.uid()
      AND venue_users.role IN ('administrator', 'editor')
      AND venue_users.deactivated_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

CREATE POLICY "Venue employees can remove tags from their venues"
  ON venue_tag_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_tag_assignments.venue_id
      AND venue_users.user_id = auth.uid()
      AND venue_users.role IN ('administrator', 'editor')
      AND venue_users.deactivated_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

-- =====================================================
-- SEED DATA: Initial Categories
-- =====================================================

-- Insert top-level categories
INSERT INTO venue_categories (name, description, display_order) VALUES
  ('Museums', 'Art, history, science, and specialty museums', 1),
  ('Science Centers', 'Interactive science and technology centers', 2),
  ('Historical Sites', 'Historic landmarks, monuments, and heritage sites', 3),
  ('Nature Centers', 'Wildlife, botanical gardens, and environmental education', 4),
  ('Performing Arts', 'Theaters, concert halls, and performance venues', 5),
  ('Cultural Centers', 'Cultural institutions and community centers', 6),
  ('Educational Facilities', 'Universities, research centers, and educational institutions', 7),
  ('Recreation', 'Parks, sports facilities, and recreational venues', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert subcategories for Museums
INSERT INTO venue_categories (name, parent_id, description, display_order)
SELECT 
  subcategory.name,
  parent.id,
  subcategory.description,
  subcategory.display_order
FROM (VALUES
  ('Art Museums', 'Fine art, contemporary art, and art galleries', 1),
  ('History Museums', 'Local, regional, and national history museums', 2),
  ('Science Museums', 'Natural history, science, and technology museums', 3),
  ('Children''s Museums', 'Interactive museums designed for children', 4),
  ('Specialty Museums', 'Transportation, military, maritime, and other specialty museums', 5)
) AS subcategory(name, description, display_order)
CROSS JOIN venue_categories parent
WHERE parent.name = 'Museums'
ON CONFLICT (name) DO NOTHING;

-- Insert subcategories for Science Centers
INSERT INTO venue_categories (name, parent_id, description, display_order)
SELECT 
  subcategory.name,
  parent.id,
  subcategory.description,
  subcategory.display_order
FROM (VALUES
  ('Planetariums', 'Astronomy and space science centers', 1),
  ('Aquariums', 'Marine life and ocean education centers', 2),
  ('Discovery Centers', 'Hands-on science exploration centers', 3)
) AS subcategory(name, description, display_order)
CROSS JOIN venue_categories parent
WHERE parent.name = 'Science Centers'
ON CONFLICT (name) DO NOTHING;

-- Insert subcategories for Historical Sites
INSERT INTO venue_categories (name, parent_id, description, display_order)
SELECT 
  subcategory.name,
  parent.id,
  subcategory.description,
  subcategory.display_order
FROM (VALUES
  ('National Parks', 'National parks with historical significance', 1),
  ('Historic Houses', 'Historic homes and estates', 2),
  ('Monuments', 'Memorials and monuments', 3),
  ('Archaeological Sites', 'Archaeological digs and ancient sites', 4)
) AS subcategory(name, description, display_order)
CROSS JOIN venue_categories parent
WHERE parent.name = 'Historical Sites'
ON CONFLICT (name) DO NOTHING;

-- Insert subcategories for Nature Centers
INSERT INTO venue_categories (name, parent_id, description, display_order)
SELECT 
  subcategory.name,
  parent.id,
  subcategory.description,
  subcategory.display_order
FROM (VALUES
  ('Zoos', 'Zoological parks and animal sanctuaries', 1),
  ('Botanical Gardens', 'Gardens and arboretums', 2),
  ('Wildlife Refuges', 'Wildlife conservation areas', 3),
  ('Environmental Centers', 'Environmental education and conservation centers', 4)
) AS subcategory(name, description, display_order)
CROSS JOIN venue_categories parent
WHERE parent.name = 'Nature Centers'
ON CONFLICT (name) DO NOTHING;

-- Insert subcategories for Performing Arts
INSERT INTO venue_categories (name, parent_id, description, display_order)
SELECT 
  subcategory.name,
  parent.id,
  subcategory.description,
  subcategory.display_order
FROM (VALUES
  ('Theaters', 'Live theater and drama venues', 1),
  ('Concert Halls', 'Music performance venues', 2),
  ('Opera Houses', 'Opera and classical music venues', 3),
  ('Dance Studios', 'Dance performance and education venues', 4)
) AS subcategory(name, description, display_order)
CROSS JOIN venue_categories parent
WHERE parent.name = 'Performing Arts'
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SEED DATA: Common Tags
-- =====================================================

INSERT INTO venue_tags (name, description) VALUES
  ('STEM', 'Science, Technology, Engineering, and Mathematics focus'),
  ('Arts', 'Visual and performing arts'),
  ('Hands-On', 'Interactive, hands-on learning experiences'),
  ('Outdoor', 'Outdoor activities and experiences'),
  ('Indoor', 'Indoor activities and experiences'),
  ('Wheelchair Accessible', 'Fully wheelchair accessible facility'),
  ('Free Admission', 'No admission fee'),
  ('Group Discounts', 'Discounts available for school groups'),
  ('Guided Tours', 'Guided tours available'),
  ('Self-Guided', 'Self-guided exploration available'),
  ('Educational Programs', 'Structured educational programs offered'),
  ('Workshops', 'Hands-on workshops available'),
  ('Field Trip Friendly', 'Specifically designed for school field trips'),
  ('Lunch Facilities', 'On-site lunch facilities available'),
  ('Gift Shop', 'Gift shop on premises'),
  ('Parking Available', 'Parking available for buses'),
  ('Virtual Tours', 'Virtual tour options available'),
  ('Multilingual', 'Materials available in multiple languages')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE venue_categories IS 'Hierarchical categorization system for venues';
COMMENT ON TABLE venue_category_assignments IS 'Many-to-many relationship between venues and categories';
COMMENT ON TABLE venue_tags IS 'Flat tagging system for venue features and themes';
COMMENT ON TABLE venue_tag_assignments IS 'Many-to-many relationship between venues and tags';
COMMENT ON FUNCTION get_category_tree IS 'Recursively retrieves all subcategories of a given category';
COMMENT ON FUNCTION get_category_path IS 'Returns the full category path (breadcrumb) for a category';
COMMENT ON FUNCTION count_venues_in_category IS 'Counts venues in a category including all subcategories';
