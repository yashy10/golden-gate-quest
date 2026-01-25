-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT,
  category TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  hero_image TEXT,
  historic_image TEXT,
  historic_year TEXT,
  short_summary TEXT,
  full_description TEXT,
  hints TEXT[] DEFAULT '{}',
  vibe TEXT,
  accessibility BOOLEAN DEFAULT true,
  best_time_of_day TEXT[] DEFAULT '{}',
  duration_minutes INTEGER DEFAULT 30,
  difficulty TEXT DEFAULT 'easy',
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_stops table
CREATE TABLE public.food_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  price_range TEXT NOT NULL CHECK (price_range IN ('$', '$$', '$$$')),
  neighborhood TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  recommendations TEXT[] DEFAULT '{}',
  image TEXT,
  vibe TEXT,
  dietary_options TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staging table for CSV import
CREATE TABLE public.locations_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  osm_id TEXT,
  name TEXT NOT NULL,
  category TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  neighborhood TEXT,
  source_file TEXT,
  -- AI-enriched fields
  short_summary TEXT,
  full_description TEXT,
  hints TEXT[] DEFAULT '{}',
  vibe TEXT,
  price_range TEXT,
  cuisine TEXT,
  recommendations TEXT[] DEFAULT '{}',
  dietary_options TEXT[] DEFAULT '{}',
  is_food_stop BOOLEAN DEFAULT false,
  enriched BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations_staging ENABLE ROW LEVEL SECURITY;

-- Public read access for locations (quest data is public)
CREATE POLICY "Locations are publicly readable" 
ON public.locations FOR SELECT 
USING (true);

-- Public read access for food stops
CREATE POLICY "Food stops are publicly readable" 
ON public.food_stops FOR SELECT 
USING (true);

-- Service role access for staging (used by import scripts)
CREATE POLICY "Service role can manage staging" 
ON public.locations_staging FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_locations_category ON public.locations(category);
CREATE INDEX idx_locations_neighborhood ON public.locations(neighborhood);
CREATE INDEX idx_locations_coords ON public.locations(lat, lng);
CREATE INDEX idx_food_stops_neighborhood ON public.food_stops(neighborhood);
CREATE INDEX idx_food_stops_price ON public.food_stops(price_range);

-- Create vector similarity search function for locations
CREATE OR REPLACE FUNCTION public.match_locations(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 20,
  filter_categories TEXT[] DEFAULT NULL,
  filter_accessible BOOLEAN DEFAULT NULL,
  filter_neighborhoods TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  neighborhood TEXT,
  address TEXT,
  category TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  hero_image TEXT,
  historic_image TEXT,
  historic_year TEXT,
  short_summary TEXT,
  full_description TEXT,
  hints TEXT[],
  vibe TEXT,
  accessibility BOOLEAN,
  best_time_of_day TEXT[],
  duration_minutes INTEGER,
  difficulty TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    l.accessibility,
    l.best_time_of_day,
    l.duration_minutes,
    l.difficulty,
    l.tags,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM public.locations l
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

-- Create vector similarity search function for food stops
CREATE OR REPLACE FUNCTION public.match_food_stops(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10,
  filter_price_ranges TEXT[] DEFAULT NULL,
  filter_neighborhoods TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  cuisine TEXT,
  price_range TEXT,
  neighborhood TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  recommendations TEXT[],
  image TEXT,
  vibe TEXT,
  dietary_options TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    f.dietary_options,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM public.food_stops f
  WHERE 
    f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
    AND (filter_price_ranges IS NULL OR f.price_range = ANY(filter_price_ranges))
    AND (filter_neighborhoods IS NULL OR f.neighborhood = ANY(filter_neighborhoods))
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;