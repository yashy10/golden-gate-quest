/**
 * Migration to Production Script
 *
 * Moves enriched data from osm_imports staging table to production
 * locations and food_stops tables, generating vector embeddings.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-production.ts
 *
 * Options:
 *   --limit=N     Migrate only N records (default: all enriched)
 *   --source=X    Migrate only from source: restaurants, parks, buildings
 *   --dry-run     Preview without saving to database
 *
 * Prerequisites:
 *   - Run enrich-locations.ts first
 *   - Set OPENAI_API_KEY environment variable
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 */

import { createClient } from "@supabase/supabase-js";

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split("=")[1];
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const LIMIT = getArg("limit") ? parseInt(getArg("limit")!) : 1000;
const SOURCE_FILTER = getArg("source");
const DRY_RUN = hasFlag("dry-run");

// ============================================
// Embedding Generation
// ============================================

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function createLocationEmbeddingText(record: any): string {
  return [
    record.name,
    record.neighborhood || "",
    record.suggested_category || "",
    record.short_summary || "",
    record.vibe || "",
    (record.hints || []).join(" "),
  ]
    .filter(Boolean)
    .join(" | ");
}

function createFoodStopEmbeddingText(record: any): string {
  return [
    record.name,
    record.cuisine || "",
    record.neighborhood || "",
    record.price_range || "",
    record.vibe || "",
    (record.recommendations || []).join(", "),
  ]
    .filter(Boolean)
    .join(" | ");
}

// ============================================
// Migration Functions
// ============================================

async function migrateLocations(records: any[]): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  for (const record of records) {
    try {
      process.stdout.write(`  Migrating: ${record.name.substring(0, 35).padEnd(35)} `);

      // Generate embedding
      const embeddingText = createLocationEmbeddingText(record);
      const embedding = await generateEmbedding(embeddingText);

      // Prepare location record
      const locationData = {
        osm_id: record.id,
        name: record.name,
        neighborhood: record.neighborhood || "San Francisco",
        address: record.raw_data?.address || "",
        category: record.suggested_category || "hidden-gems",
        lat: record.lat,
        lng: record.lng,
        hero_image: "", // Left empty per user request
        historic_image: "",
        historic_year: record.historic_year || "",
        short_summary: record.short_summary || "",
        full_description: record.full_description || "",
        hints: record.hints || [],
        vibe: record.vibe || "",
        accessibility: record.raw_data?.wheelchair === "yes",
        embedding,
      };

      if (!DRY_RUN) {
        const { error } = await supabase.from("locations").upsert(locationData, {
          onConflict: "osm_id",
        });

        if (error) throw error;

        // Mark as migrated in staging table
        await supabase
          .from("osm_imports")
          .update({
            enrichment_status: "migrated",
            migrated_at: new Date().toISOString(),
          })
          .eq("id", record.id);
      }

      console.log(`✅ ${record.suggested_category}`);
      success++;

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.log(`❌`);
      console.error(`     Error: ${err instanceof Error ? err.message : err}`);
      errors++;
    }
  }

  return { success, errors };
}

async function migrateFoodStops(records: any[]): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  for (const record of records) {
    try {
      process.stdout.write(`  Migrating: ${record.name.substring(0, 35).padEnd(35)} `);

      // Generate embedding
      const embeddingText = createFoodStopEmbeddingText(record);
      const embedding = await generateEmbedding(embeddingText);

      // Prepare food stop record
      const foodStopData = {
        osm_id: record.id,
        name: record.name,
        cuisine: record.cuisine || record.raw_data?.cuisine || "Restaurant",
        price_range: record.price_range || "$$",
        neighborhood: record.neighborhood || "San Francisco",
        lat: record.lat,
        lng: record.lng,
        recommendations: record.recommendations || [],
        image: "", // Left empty per user request
        vibe: record.vibe || "",
        embedding,
      };

      if (!DRY_RUN) {
        const { error } = await supabase.from("food_stops").upsert(foodStopData, {
          onConflict: "osm_id",
        });

        if (error) throw error;

        // Mark as migrated
        await supabase
          .from("osm_imports")
          .update({
            enrichment_status: "migrated",
            migrated_at: new Date().toISOString(),
          })
          .eq("id", record.id);
      }

      console.log(`✅ ${record.price_range}`);
      success++;

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.log(`❌`);
      console.error(`     Error: ${err instanceof Error ? err.message : err}`);
      errors++;
    }
  }

  return { success, errors };
}

// ============================================
// Main
// ============================================

async function main() {
  console.log("🚀 Golden Gate Quest - Migration to Production\n");
  console.log("=".repeat(50));

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be saved\n");
  }

  // Query enriched records
  let query = supabase
    .from("osm_imports")
    .select("*")
    .eq("enrichment_status", "enriched")
    .order("quality_score", { ascending: false })
    .limit(LIMIT);

  if (SOURCE_FILTER) {
    query = query.eq("source_file", SOURCE_FILTER);
  }

  const { data: records, error } = await query;

  if (error) {
    console.error("❌ Failed to fetch records:", error.message);
    process.exit(1);
  }

  if (!records || records.length === 0) {
    console.log("✅ No enriched records to migrate");
    return;
  }

  // Separate by type
  const foodStops = records.filter((r) => r.source_file === "restaurants");
  const locations = records.filter((r) => r.source_file !== "restaurants");

  console.log(`\n📋 Found ${records.length} enriched records:`);
  console.log(`   - ${locations.length} locations (parks, buildings)`);
  console.log(`   - ${foodStops.length} food stops (restaurants)\n`);

  // Migrate locations
  if (locations.length > 0) {
    console.log("\n🏛️  Migrating locations...\n");
    const locResult = await migrateLocations(locations);
    console.log(`\n   Locations: ${locResult.success} success, ${locResult.errors} errors`);
  }

  // Migrate food stops
  if (foodStops.length > 0) {
    console.log("\n🍽️  Migrating food stops...\n");
    const foodResult = await migrateFoodStops(foodStops);
    console.log(`\n   Food stops: ${foodResult.success} success, ${foodResult.errors} errors`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ Migration complete!\n");

  if (!DRY_RUN) {
    // Get final counts
    const { count: locCount } = await supabase
      .from("locations")
      .select("*", { count: "exact", head: true });

    const { count: foodCount } = await supabase
      .from("food_stops")
      .select("*", { count: "exact", head: true });

    console.log("📊 Production table counts:");
    console.log(`   - locations: ${locCount}`);
    console.log(`   - food_stops: ${foodCount}`);

    console.log("\nNext steps:");
    console.log("  1. Test the app with new data");
    console.log("  2. Regenerate TypeScript types:");
    console.log("     npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts");
  }
}

main().catch((err) => {
  console.error("\n❌ Migration failed:", err);
  process.exit(1);
});
