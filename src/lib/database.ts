/**
 * Database Query Functions
 *
 * These functions provide typed access to the Supabase database
 * with support for both structured filtering and semantic search.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/data/locations";

// ============================================
// Types
// ============================================

export interface DBLocation {
  id: string;
  name: string;
  neighborhood: string;
  address: string | null;
  category: Category;
  lat: number;
  lng: number;
  hero_image: string | null;
  historic_image: string | null;
  historic_year: string | null;
  short_summary: string | null;
  full_description: string | null;
  hints: string[];
  vibe: string | null;
  accessibility: boolean;
  best_time_of_day: string[];
  duration_minutes: number;
  difficulty: string;
  tags: string[];
  similarity?: number;
}

export interface DBFoodStop {
  id: string;
  name: string;
  cuisine: string;
  price_range: "$" | "$$" | "$$$";
  neighborhood: string;
  lat: number;
  lng: number;
  recommendations: string[];
  image: string | null;
  vibe: string | null;
  dietary_options: string[];
  similarity?: number;
}

// Convert DB format to app format
export function dbLocationToAppLocation(dbLoc: DBLocation) {
  return {
    id: dbLoc.id,
    name: dbLoc.name,
    neighborhood: dbLoc.neighborhood,
    address: dbLoc.address || "",
    coordinates: { lat: Number(dbLoc.lat), lng: Number(dbLoc.lng) },
    category: dbLoc.category,
    heroImage: dbLoc.hero_image || "",
    historicImage: dbLoc.historic_image || "",
    historicYear: dbLoc.historic_year || "",
    shortSummary: dbLoc.short_summary || "",
    fullDescription: dbLoc.full_description || "",
    hints: dbLoc.hints || [],
  };
}

export function dbFoodStopToAppFoodStop(dbFood: DBFoodStop) {
  return {
    id: dbFood.id,
    name: dbFood.name,
    cuisine: dbFood.cuisine,
    priceRange: dbFood.price_range,
    neighborhood: dbFood.neighborhood,
    coordinates: { lat: Number(dbFood.lat), lng: Number(dbFood.lng) },
    recommendations: dbFood.recommendations || [],
    image: dbFood.image || "",
  };
}

// ============================================
// Basic Queries (Structured Filtering)
// ============================================

/**
 * Fetch all locations, optionally filtered by categories
 */
export async function getLocations(options?: {
  categories?: Category[];
  accessible?: boolean;
  neighborhoods?: string[];
  limit?: number;
}) {
  let query = supabase.from("locations").select("*");

  if (options?.categories?.length) {
    query = query.in("category", options.categories);
  }

  if (options?.accessible !== undefined) {
    query = query.eq("accessibility", options.accessible);
  }

  if (options?.neighborhoods?.length) {
    query = query.in("neighborhood", options.neighborhoods);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }

  return (data as DBLocation[]).map(dbLocationToAppLocation);
}

/**
 * Fetch all food stops, optionally filtered
 */
export async function getFoodStops(options?: {
  priceRanges?: ("$" | "$$" | "$$$")[];
  neighborhoods?: string[];
  limit?: number;
}) {
  let query = supabase.from("food_stops").select("*");

  if (options?.priceRanges?.length) {
    query = query.in("price_range", options.priceRanges);
  }

  if (options?.neighborhoods?.length) {
    query = query.in("neighborhood", options.neighborhoods);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching food stops:", error);
    throw error;
  }

  return (data as DBFoodStop[]).map(dbFoodStopToAppFoodStop);
}

/**
 * Get a single location by ID
 */
export async function getLocationById(id: string) {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching location:", error);
    throw error;
  }

  return dbLocationToAppLocation(data as DBLocation);
}

// ============================================
// Semantic Search (Vector Similarity)
// ============================================

/**
 * Generate embedding for a text query using OpenAI
 * Note: In production, this should be done server-side via Edge Function
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const response = await fetch("/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate embedding");
  }

  const { embedding } = await response.json();
  return embedding;
}

/**
 * Search locations by semantic similarity + filters
 * Uses the match_locations database function
 */
export async function searchLocations(options: {
  queryEmbedding: number[];
  categories?: Category[];
  accessible?: boolean;
  neighborhoods?: string[];
  matchThreshold?: number;
  limit?: number;
}) {
  const { data, error } = await supabase.rpc("match_locations", {
    query_embedding: options.queryEmbedding,
    match_threshold: options.matchThreshold ?? 0.5,
    match_count: options.limit ?? 20,
    filter_categories: options.categories ?? null,
    filter_accessible: options.accessible ?? null,
    filter_neighborhoods: options.neighborhoods ?? null,
  });

  if (error) {
    console.error("Error searching locations:", error);
    throw error;
  }

  return (data as (DBLocation & { similarity: number })[]).map((loc) => ({
    ...dbLocationToAppLocation(loc),
    similarity: loc.similarity,
  }));
}

/**
 * Search food stops by semantic similarity + filters
 */
export async function searchFoodStops(options: {
  queryEmbedding: number[];
  priceRanges?: ("$" | "$$" | "$$$")[];
  neighborhoods?: string[];
  matchThreshold?: number;
  limit?: number;
}) {
  const { data, error } = await supabase.rpc("match_food_stops", {
    query_embedding: options.queryEmbedding,
    match_threshold: options.matchThreshold ?? 0.5,
    match_count: options.limit ?? 10,
    filter_price_ranges: options.priceRanges ?? null,
    filter_neighborhoods: options.neighborhoods ?? null,
  });

  if (error) {
    console.error("Error searching food stops:", error);
    throw error;
  }

  return (data as (DBFoodStop & { similarity: number })[]).map((food) => ({
    ...dbFoodStopToAppFoodStop(food),
    similarity: food.similarity,
  }));
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get all unique neighborhoods from locations
 */
export async function getNeighborhoods(): Promise<string[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("neighborhood")
    .order("neighborhood");

  if (error) {
    console.error("Error fetching neighborhoods:", error);
    throw error;
  }

  // Get unique neighborhoods
  const neighborhoods = [...new Set(data.map((d) => d.neighborhood))];
  return neighborhoods;
}

/**
 * Get location count by category
 */
export async function getLocationCountsByCategory(): Promise<
  Record<Category, number>
> {
  const { data, error } = await supabase.from("locations").select("category");

  if (error) {
    console.error("Error fetching location counts:", error);
    throw error;
  }

  const counts: Record<string, number> = {};
  for (const item of data) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  return counts as Record<Category, number>;
}
