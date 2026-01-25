/**
 * CSV Import Script
 *
 * Imports OpenStreetMap CSV data into the osm_imports staging table.
 * Filters to San Francisco bounds, requires names, and assigns categories.
 *
 * Usage:
 *   npx tsx scripts/import-csv-data.ts
 *
 * Prerequisites:
 *   - Run the migration first (20240125_csv_import_schema.sql)
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  console.log("Set these environment variables:");
  console.log("  export SUPABASE_URL=https://your-project.supabase.co");
  console.log("  export SUPABASE_SERVICE_KEY=your-service-role-key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// San Francisco geographic bounds
const SF_BOUNDS = {
  minLat: 37.708,
  maxLat: 37.812,
  minLng: -122.515,
  maxLng: -122.355,
};

// Category types (without street-art)
type Category =
  | "iconic"
  | "architecture"
  | "neighborhoods"
  | "hidden-gems"
  | "waterfront"
  | "parks";

// ============================================
// CSV Parsing
// ============================================

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function parseCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });

    records.push(record);
  }

  return records;
}

// ============================================
// Geographic Filtering
// ============================================

function isWithinSFBounds(lat: number, lng: number): boolean {
  return (
    lat >= SF_BOUNDS.minLat &&
    lat <= SF_BOUNDS.maxLat &&
    lng >= SF_BOUNDS.minLng &&
    lng <= SF_BOUNDS.maxLng
  );
}

function isNearWaterfront(lat: number, lng: number): boolean {
  // Northern waterfront (Fisherman's Wharf, Embarcadero)
  if (lat > 37.795 && lng > -122.42) return true;
  // Western waterfront (Ocean Beach)
  if (lng < -122.505) return true;
  // Southern waterfront (near bay)
  if (lat < 37.72 && lng > -122.4) return true;
  return false;
}

// ============================================
// Category Inference
// ============================================

// Known iconic landmarks (partial list, case-insensitive matching)
const ICONIC_KEYWORDS = [
  "golden gate",
  "coit tower",
  "transamerica",
  "city hall",
  "ferry building",
  "palace of fine arts",
  "alcatraz",
  "cable car",
  "lombard street",
  "twin peaks",
  "sutro tower",
  "salesforce tower",
  "de young",
  "california academy",
];

const ARCHITECTURE_TYPES = ["church", "cathedral", "hotel", "university", "college", "museum", "library", "theater", "theatre"];

const NEIGHBORHOOD_KEYWORDS = [
  "cultural",
  "community",
  "chinatown",
  "mission",
  "castro",
  "haight",
  "north beach",
  "japantown",
  "fillmore",
];

function inferCategoryForBuilding(record: Record<string, string>): Category | null {
  const name = (record.name || "").toLowerCase();
  const buildingType = (record.building_type || "").toLowerCase();
  const amenity = (record.amenity || "").toLowerCase();
  const startDate = record.start_date || "";
  const architect = record.architect || "";
  const lat = parseFloat(record.lat);
  const lng = parseFloat(record.lon);

  // Check for iconic landmarks
  if (ICONIC_KEYWORDS.some((kw) => name.includes(kw))) {
    return "iconic";
  }

  // Check for architecture
  if (ARCHITECTURE_TYPES.some((t) => buildingType.includes(t) || amenity.includes(t))) {
    return "architecture";
  }
  if (architect) {
    return "architecture";
  }
  if (startDate && parseInt(startDate) < 1950) {
    return "architecture";
  }

  // Check for neighborhoods/cultural centers
  if (NEIGHBORHOOD_KEYWORDS.some((kw) => name.includes(kw))) {
    return "neighborhoods";
  }
  if (amenity === "community_centre") {
    return "neighborhoods";
  }

  // Check for waterfront
  if (isNearWaterfront(lat, lng) && (name.includes("pier") || name.includes("wharf") || name.includes("marina"))) {
    return "waterfront";
  }

  return null; // Needs manual review or skip
}

function inferCategoryForPark(record: Record<string, string>): Category | null {
  const type = (record.type || "").toLowerCase();
  const name = (record.name || "").toLowerCase();
  const lat = parseFloat(record.lat);
  const lng = parseFloat(record.lon);

  // Hidden gems
  if (["garden", "dog_park", "recreation_ground"].includes(type)) {
    return "hidden-gems";
  }

  // Waterfront parks
  if (isNearWaterfront(lat, lng) || name.includes("beach") || name.includes("shore") || name.includes("pier")) {
    return "waterfront";
  }

  // Parks
  if (["park", "nature_reserve", "national_park"].includes(type)) {
    return "parks";
  }

  // Playgrounds as hidden gems
  if (type === "playground" && name) {
    return "hidden-gems";
  }

  return "parks"; // Default for leisure
}

// ============================================
// Quality Scoring
// ============================================

function calculateQualityScore(record: Record<string, string>, sourceType: string): number {
  let score = 0;

  // Name is essential (already filtered, but weight it)
  if (record.name && record.name.length > 3) score += 0.3;

  // Address adds value
  if (record.address) score += 0.1;

  // Source-specific scoring
  if (sourceType === "buildings") {
    if (record.architect) score += 0.2;
    if (record.start_date) score += 0.15;
    if (record.height && parseFloat(record.height) > 20) score += 0.1;
    if (record.building_type && record.building_type !== "yes") score += 0.1;
  }

  if (sourceType === "parks") {
    if (record.wheelchair === "yes") score += 0.1;
    if (record.opening_hours) score += 0.1;
    if (record.operator) score += 0.05;
  }

  if (sourceType === "restaurants") {
    if (record.cuisine) score += 0.2;
    if (record.opening_hours) score += 0.1;
    if (record.phone || record.website) score += 0.1;
    if (record.wheelchair === "yes") score += 0.1;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

// ============================================
// Import Functions
// ============================================

interface ImportResult {
  total: number;
  filtered: number;
  imported: number;
  skipped: number;
  errors: number;
}

async function importRestaurants(): Promise<ImportResult> {
  console.log("\n🍽️  Importing restaurants_and_cafes.csv...\n");

  const csvPath = path.join(process.cwd(), "restaurants_and_cafes.csv");
  const records = parseCSV(csvPath);

  const result: ImportResult = {
    total: records.length,
    filtered: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  const validTypes = ["restaurant", "cafe", "pub", "bar", "fast_food", "ice_cream"];
  const toImport: any[] = [];

  for (const record of records) {
    const lat = parseFloat(record.lat);
    const lng = parseFloat(record.lon);
    const name = record.name?.trim();
    const type = record.type?.toLowerCase();

    // Filter criteria
    if (!name) {
      result.skipped++;
      continue;
    }
    if (!isWithinSFBounds(lat, lng)) {
      result.filtered++;
      continue;
    }
    if (!validTypes.includes(type)) {
      result.skipped++;
      continue;
    }

    const qualityScore = calculateQualityScore(record, "restaurants");

    toImport.push({
      id: record.id,
      source_file: "restaurants",
      lat,
      lng,
      name,
      osm_type: type,
      raw_data: record,
      suggested_category: null, // Food stops don't have categories
      quality_score: qualityScore,
      cuisine: record.cuisine || null,
      enrichment_status: "pending",
    });
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < toImport.length; i += batchSize) {
    const batch = toImport.slice(i, i + batchSize);
    const { error } = await supabase.from("osm_imports").upsert(batch, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      result.errors += batch.length;
    } else {
      result.imported += batch.length;
      process.stdout.write(`  Imported ${result.imported}/${toImport.length}\r`);
    }
  }

  console.log(`  ✅ Imported ${result.imported} restaurants`);
  return result;
}

async function importParks(): Promise<ImportResult> {
  console.log("\n🌲 Importing parks_and_leisure.csv...\n");

  const csvPath = path.join(process.cwd(), "parks_and_leisure.csv");
  const records = parseCSV(csvPath);

  const result: ImportResult = {
    total: records.length,
    filtered: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  const validTypes = ["park", "garden", "playground", "nature_reserve", "dog_park", "recreation_ground"];
  const toImport: any[] = [];

  for (const record of records) {
    const lat = parseFloat(record.lat);
    const lng = parseFloat(record.lon);
    const name = record.name?.trim();
    const type = record.type?.toLowerCase();
    const access = record.access?.toLowerCase();

    // Filter criteria
    if (!name) {
      result.skipped++;
      continue;
    }
    if (!isWithinSFBounds(lat, lng)) {
      result.filtered++;
      continue;
    }
    if (!validTypes.includes(type)) {
      result.skipped++;
      continue;
    }
    if (access === "private") {
      result.skipped++;
      continue;
    }

    const category = inferCategoryForPark(record);
    const qualityScore = calculateQualityScore(record, "parks");

    toImport.push({
      id: record.id,
      source_file: "parks",
      lat,
      lng,
      name,
      osm_type: type,
      raw_data: record,
      suggested_category: category,
      quality_score: qualityScore,
      enrichment_status: "pending",
    });
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < toImport.length; i += batchSize) {
    const batch = toImport.slice(i, i + batchSize);
    const { error } = await supabase.from("osm_imports").upsert(batch, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Error inserting batch:`, error.message);
      result.errors += batch.length;
    } else {
      result.imported += batch.length;
      process.stdout.write(`  Imported ${result.imported}/${toImport.length}\r`);
    }
  }

  console.log(`  ✅ Imported ${result.imported} parks/leisure`);
  return result;
}

async function importBuildings(): Promise<ImportResult> {
  console.log("\n🏛️  Importing buildings.csv (this may take a while)...\n");

  const csvPath = path.join(process.cwd(), "buildings.csv");
  const records = parseCSV(csvPath);

  const result: ImportResult = {
    total: records.length,
    filtered: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  const toImport: any[] = [];

  for (const record of records) {
    const lat = parseFloat(record.lat);
    const lng = parseFloat(record.lon);
    const name = record.name?.trim();

    // Filter criteria - MUST have name (this filters out ~156K records)
    if (!name) {
      result.skipped++;
      continue;
    }
    if (!isWithinSFBounds(lat, lng)) {
      result.filtered++;
      continue;
    }

    // Additional quality filter: must have at least one notable attribute
    const hasArchitect = !!record.architect;
    const hasStartDate = !!record.start_date;
    const hasHeight = record.height && parseFloat(record.height) > 20;
    const hasNotableType = record.building_type && record.building_type !== "yes" && record.building_type !== "residential";

    if (!hasArchitect && !hasStartDate && !hasHeight && !hasNotableType) {
      result.skipped++;
      continue;
    }

    const category = inferCategoryForBuilding(record);

    // Skip if no category could be inferred
    if (!category) {
      result.skipped++;
      continue;
    }

    const qualityScore = calculateQualityScore(record, "buildings");

    // Construct address from parts
    let address = record.address || "";
    if (!address && record.addr_housenumber && record.addr_street) {
      address = `${record.addr_housenumber} ${record.addr_street}`;
      if (record.addr_city) address += `, ${record.addr_city}`;
      if (record.addr_postcode) address += ` ${record.addr_postcode}`;
    }

    toImport.push({
      id: record.id,
      source_file: "buildings",
      lat,
      lng,
      name,
      osm_type: record.building_type || "building",
      raw_data: record,
      suggested_category: category,
      quality_score: qualityScore,
      historic_year: record.start_date || null,
      enrichment_status: "pending",
    });
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < toImport.length; i += batchSize) {
    const batch = toImport.slice(i, i + batchSize);
    const { error } = await supabase.from("osm_imports").upsert(batch, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Error inserting batch:`, error.message);
      result.errors += batch.length;
    } else {
      result.imported += batch.length;
      process.stdout.write(`  Imported ${result.imported}/${toImport.length}\r`);
    }
  }

  console.log(`  ✅ Imported ${result.imported} buildings`);
  return result;
}

// ============================================
// Main
// ============================================

async function main() {
  console.log("🌉 Golden Gate Quest - CSV Data Import\n");
  console.log("=".repeat(50));

  try {
    const restaurantResult = await importRestaurants();
    const parkResult = await importParks();
    const buildingResult = await importBuildings();

    console.log("\n" + "=".repeat(50));
    console.log("\n📊 Import Summary:\n");

    console.log("Restaurants:");
    console.log(`  Total in CSV: ${restaurantResult.total}`);
    console.log(`  Outside SF: ${restaurantResult.filtered}`);
    console.log(`  Skipped (no name/wrong type): ${restaurantResult.skipped}`);
    console.log(`  Imported: ${restaurantResult.imported}`);

    console.log("\nParks & Leisure:");
    console.log(`  Total in CSV: ${parkResult.total}`);
    console.log(`  Outside SF: ${parkResult.filtered}`);
    console.log(`  Skipped: ${parkResult.skipped}`);
    console.log(`  Imported: ${parkResult.imported}`);

    console.log("\nBuildings:");
    console.log(`  Total in CSV: ${buildingResult.total}`);
    console.log(`  Outside SF: ${buildingResult.filtered}`);
    console.log(`  Skipped (no name/not notable): ${buildingResult.skipped}`);
    console.log(`  Imported: ${buildingResult.imported}`);

    const totalImported = restaurantResult.imported + parkResult.imported + buildingResult.imported;
    console.log(`\n✅ Total imported: ${totalImported} records`);

    console.log("\nNext steps:");
    console.log("  1. Review imports in Supabase dashboard");
    console.log("  2. Run: npx tsx scripts/enrich-locations.ts");
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

main();
