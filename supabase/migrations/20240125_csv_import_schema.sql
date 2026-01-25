-- ============================================
-- CSV Import Staging Schema
-- ============================================
-- This migration creates a staging table for importing
-- OpenStreetMap CSV data before enrichment and production migration.

-- ============================================
-- STAGING TABLE FOR RAW CSV IMPORTS
-- ============================================
CREATE TABLE osm_imports (
  id TEXT PRIMARY KEY,                      -- OSM ID (node/xxx or way/xxx)
  source_file TEXT NOT NULL,                -- 'restaurants', 'parks', 'buildings'
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  name TEXT,
  osm_type TEXT,                            -- Original type from CSV
  raw_data JSONB,                           -- All original fields preserved

  -- Categorization
  suggested_category TEXT,                  -- Suggested app category
  quality_score DECIMAL(3, 2) DEFAULT 0,    -- 0.00 to 1.00

  -- Enriched content (populated by AI)
  short_summary TEXT,
  full_description TEXT,
  vibe TEXT,
  hints TEXT[],
  neighborhood TEXT,
  historic_year TEXT,

  -- For food stops only
  cuisine TEXT,
  price_range TEXT,
  recommendations TEXT[],

  -- Processing status
  enrichment_status TEXT DEFAULT 'pending', -- 'pending', 'enriched', 'migrated', 'skipped'
  enriched_at TIMESTAMPTZ,
  migrated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR EFFICIENT QUERYING
-- ============================================
CREATE INDEX osm_imports_source_idx ON osm_imports(source_file);
CREATE INDEX osm_imports_status_idx ON osm_imports(enrichment_status);
CREATE INDEX osm_imports_quality_idx ON osm_imports(quality_score DESC);
CREATE INDEX osm_imports_category_idx ON osm_imports(suggested_category);
CREATE INDEX osm_imports_coords_idx ON osm_imports(lat, lng);

-- ============================================
-- ADD OSM_ID TO PRODUCTION TABLES
-- ============================================
-- Track the origin of imported records
ALTER TABLE locations ADD COLUMN IF NOT EXISTS osm_id TEXT;
ALTER TABLE food_stops ADD COLUMN IF NOT EXISTS osm_id TEXT;

-- ============================================
-- UPDATE CATEGORY ENUM (remove street-art)
-- ============================================
-- Note: PostgreSQL doesn't allow removing values from enums easily.
-- We'll handle this by updating the app code and ignoring street-art
-- in queries. The enum value remains but won't be used.

-- ============================================
-- HELPER FUNCTION: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_osm_imports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_osm_imports_timestamp
  BEFORE UPDATE ON osm_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_osm_imports_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE osm_imports ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for admin dashboard)
CREATE POLICY "Allow public read access to osm_imports"
  ON osm_imports FOR SELECT
  USING (true);

-- ============================================
-- USEFUL QUERIES (for reference, not executed)
-- ============================================
-- Get counts by source and status:
-- SELECT source_file, enrichment_status, COUNT(*)
-- FROM osm_imports GROUP BY source_file, enrichment_status;

-- Get top candidates for enrichment:
-- SELECT * FROM osm_imports
-- WHERE enrichment_status = 'pending' AND name IS NOT NULL
-- ORDER BY quality_score DESC LIMIT 50;
