-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for categories
CREATE TYPE location_category AS ENUM (
  'iconic',
  'architecture',
  'neighborhoods',
  'street-art',
  'hidden-gems',
  'waterfront',
  'parks'
);

-- Create enum for price ranges
CREATE TYPE price_range AS ENUM ('$', '$$', '$$$');

-- ============================================
-- LOCATIONS TABLE
-- ============================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT,
  category location_category NOT NULL,

  -- Coordinates
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,

  -- Images
  hero_image TEXT,
  historic_image TEXT,
  historic_year TEXT,

  -- Content
  short_summary TEXT,
  full_description TEXT,
  hints TEXT[] DEFAULT '{}',

  -- Filtering attributes
  accessibility BOOLEAN DEFAULT true,
  best_time_of_day TEXT[] DEFAULT '{}', -- 'morning', 'afternoon', 'sunset', 'night'
  duration_minutes INT DEFAULT 30,
  difficulty TEXT DEFAULT 'easy', -- 'easy', 'moderate', 'challenging'

  -- Semantic search fields
  vibe TEXT, -- "romantic sunset spot", "gritty urban art", "family-friendly adventure"
  tags TEXT[] DEFAULT '{}', -- flexible tagging for filtering

  -- Vector embedding for semantic search (1536 dimensions for OpenAI text-embedding-3-small)
  embedding VECTOR(1536),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FOOD STOPS TABLE
-- ============================================
CREATE TABLE food_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  price_range price_range NOT NULL,
  neighborhood TEXT NOT NULL,

  -- Coordinates
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,

  -- Content
  recommendations TEXT[] DEFAULT '{}',
  image TEXT,

  -- Additional attributes for filtering
  dietary_options TEXT[] DEFAULT '{}', -- 'vegan', 'vegetarian', 'gluten-free'
  vibe TEXT, -- "casual counter service", "upscale dining", "quick bite"

  -- Vector embedding
  embedding VECTOR(1536),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER DISCOVERIES TABLE (for future use)
-- ============================================
CREATE TABLE user_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Can link to auth.users later
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  photo_url TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  notes TEXT
);

-- ============================================
-- INDEXES
-- ============================================

-- Vector similarity search index (IVFFlat for approximate nearest neighbor)
CREATE INDEX locations_embedding_idx ON locations
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX food_stops_embedding_idx ON food_stops
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Standard indexes for filtering
CREATE INDEX locations_category_idx ON locations(category);
CREATE INDEX locations_neighborhood_idx ON locations(neighborhood);
CREATE INDEX locations_accessibility_idx ON locations(accessibility);
CREATE INDEX food_stops_price_range_idx ON food_stops(price_range);
CREATE INDEX food_stops_neighborhood_idx ON food_stops(neighborhood);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to search locations by semantic similarity + filters
CREATE OR REPLACE FUNCTION match_locations(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 20,
  filter_categories location_category[] DEFAULT NULL,
  filter_accessible BOOLEAN DEFAULT NULL,
  filter_neighborhoods TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  neighborhood TEXT,
  address TEXT,
  category location_category,
  lat DECIMAL,
  lng DECIMAL,
  hero_image TEXT,
  historic_image TEXT,
  historic_year TEXT,
  short_summary TEXT,
  full_description TEXT,
  hints TEXT[],
  vibe TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.neighborhood,
    l.address,
    l.category,
    l.lat,
    l.lng,
    l.hero_image,
    l.historic_image,
    l.historic_year,
    l.short_summary,
    l.full_description,
    l.hints,
    l.vibe,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM locations l
  WHERE
    l.embedding IS NOT NULL
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
    AND (filter_categories IS NULL OR l.category = ANY(filter_categories))
    AND (filter_accessible IS NULL OR l.accessibility = filter_accessible)
    AND (filter_neighborhoods IS NULL OR l.neighborhood = ANY(filter_neighborhoods))
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search food stops by semantic similarity + filters
CREATE OR REPLACE FUNCTION match_food_stops(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_price_ranges price_range[] DEFAULT NULL,
  filter_neighborhoods TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  cuisine TEXT,
  price_range price_range,
  neighborhood TEXT,
  lat DECIMAL,
  lng DECIMAL,
  recommendations TEXT[],
  image TEXT,
  vibe TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.cuisine,
    f.price_range,
    f.neighborhood,
    f.lat,
    f.lng,
    f.recommendations,
    f.image,
    f.vibe,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM food_stops f
  WHERE
    f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
    AND (filter_price_ranges IS NULL OR f.price_range = ANY(filter_price_ranges))
    AND (filter_neighborhoods IS NULL OR f.neighborhood = ANY(filter_neighborhoods))
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_stops_updated_at
  BEFORE UPDATE ON food_stops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_discoveries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to locations and food_stops
CREATE POLICY "Allow public read access to locations"
  ON locations FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to food_stops"
  ON food_stops FOR SELECT
  USING (true);

-- User discoveries - users can only see their own
CREATE POLICY "Users can view their own discoveries"
  ON user_discoveries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discoveries"
  ON user_discoveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);
