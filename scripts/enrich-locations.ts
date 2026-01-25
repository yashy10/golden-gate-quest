/**
 * AI Enrichment Script
 *
 * Uses GPT-4o-mini to generate rich content for imported OSM locations:
 * - short_summary, full_description, vibe, hints for locations
 * - price_range, recommendations for food stops
 * - neighborhood derived from coordinates
 *
 * Usage:
 *   npx tsx scripts/enrich-locations.ts
 *
 * Options:
 *   --limit=N     Process only N records (default: all pending)
 *   --source=X    Process only from source: restaurants, parks, buildings
 *   --dry-run     Preview without saving to database
 *
 * Prerequisites:
 *   - Run import-csv-data.ts first
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

// SF Neighborhoods for coordinate-based lookup
const SF_NEIGHBORHOODS: { name: string; bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } }[] = [
  { name: "Financial District", bounds: { minLat: 37.788, maxLat: 37.798, minLng: -122.408, maxLng: -122.394 } },
  { name: "Chinatown", bounds: { minLat: 37.792, maxLat: 37.798, minLng: -122.41, maxLng: -122.403 } },
  { name: "North Beach", bounds: { minLat: 37.798, maxLat: 37.808, minLng: -122.415, maxLng: -122.4 } },
  { name: "Fisherman's Wharf", bounds: { minLat: 37.805, maxLat: 37.812, minLng: -122.425, maxLng: -122.405 } },
  { name: "Marina District", bounds: { minLat: 37.8, maxLat: 37.808, minLng: -122.45, maxLng: -122.43 } },
  { name: "Pacific Heights", bounds: { minLat: 37.788, maxLat: 37.795, minLng: -122.45, maxLng: -122.42 } },
  { name: "Russian Hill", bounds: { minLat: 37.798, maxLat: 37.805, minLng: -122.425, maxLng: -122.41 } },
  { name: "Nob Hill", bounds: { minLat: 37.79, maxLat: 37.795, minLng: -122.42, maxLng: -122.408 } },
  { name: "Tenderloin", bounds: { minLat: 37.78, maxLat: 37.788, minLng: -122.42, maxLng: -122.405 } },
  { name: "SoMa", bounds: { minLat: 37.77, maxLat: 37.788, minLng: -122.41, maxLng: -122.39 } },
  { name: "Mission District", bounds: { minLat: 37.748, maxLat: 37.77, minLng: -122.43, maxLng: -122.405 } },
  { name: "Castro", bounds: { minLat: 37.758, maxLat: 37.768, minLng: -122.44, maxLng: -122.43 } },
  { name: "Haight-Ashbury", bounds: { minLat: 37.765, maxLat: 37.775, minLng: -122.455, maxLng: -122.44 } },
  { name: "Inner Sunset", bounds: { minLat: 37.758, maxLat: 37.768, minLng: -122.475, maxLng: -122.455 } },
  { name: "Outer Sunset", bounds: { minLat: 37.748, maxLat: 37.758, minLng: -122.51, maxLng: -122.475 } },
  { name: "Richmond District", bounds: { minLat: 37.775, maxLat: 37.788, minLng: -122.51, maxLng: -122.455 } },
  { name: "Presidio", bounds: { minLat: 37.788, maxLat: 37.805, minLng: -122.485, maxLng: -122.45 } },
  { name: "Golden Gate Park", bounds: { minLat: 37.765, maxLat: 37.775, minLng: -122.51, maxLng: -122.455 } },
  { name: "Potrero Hill", bounds: { minLat: 37.755, maxLat: 37.765, minLng: -122.405, maxLng: -122.39 } },
  { name: "Dogpatch", bounds: { minLat: 37.755, maxLat: 37.765, minLng: -122.395, maxLng: -122.385 } },
  { name: "Bayview", bounds: { minLat: 37.725, maxLat: 37.745, minLng: -122.4, maxLng: -122.375 } },
  { name: "Excelsior", bounds: { minLat: 37.72, maxLat: 37.73, minLng: -122.435, maxLng: -122.41 } },
  { name: "Glen Park", bounds: { minLat: 37.73, maxLat: 37.745, minLng: -122.44, maxLng: -122.425 } },
  { name: "Noe Valley", bounds: { minLat: 37.745, maxLat: 37.755, minLng: -122.44, maxLng: -122.425 } },
  { name: "Bernal Heights", bounds: { minLat: 37.735, maxLat: 37.748, minLng: -122.42, maxLng: -122.4 } },
  { name: "Twin Peaks", bounds: { minLat: 37.748, maxLat: 37.758, minLng: -122.455, maxLng: -122.44 } },
];

function getNeighborhoodFromCoords(lat: number, lng: number): string {
  for (const hood of SF_NEIGHBORHOODS) {
    if (
      lat >= hood.bounds.minLat &&
      lat <= hood.bounds.maxLat &&
      lng >= hood.bounds.minLng &&
      lng <= hood.bounds.maxLng
    ) {
      return hood.name;
    }
  }
  return "San Francisco"; // Default fallback
}

// ============================================
// OpenAI API
// ============================================

interface LocationEnrichment {
  short_summary: string;
  full_description: string;
  vibe: string;
  hints: string[];
  suggested_category: string;
  historic_year?: string;
}

interface FoodStopEnrichment {
  short_summary: string;
  vibe: string;
  price_range: "$" | "$$" | "$$$";
  recommendations: string[];
}

async function callOpenAI(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function enrichLocation(record: any): Promise<LocationEnrichment> {
  const rawData = record.raw_data || {};
  const systemPrompt = `You are a San Francisco local expert and tour guide. Generate engaging, factual content for a treasure hunt exploration app. Be concise but interesting. Always respond with valid JSON.`;

  const prompt = `Generate content for this San Francisco location:

Name: ${record.name}
Type: ${record.osm_type || "unknown"}
Neighborhood: ${getNeighborhoodFromCoords(record.lat, record.lng)}
Coordinates: ${record.lat}, ${record.lng}
${rawData.architect ? `Architect: ${rawData.architect}` : ""}
${rawData.start_date ? `Built: ${rawData.start_date}` : ""}
${rawData.building_type ? `Building Type: ${rawData.building_type}` : ""}
${rawData.type ? `Leisure Type: ${rawData.type}` : ""}

Respond with JSON in this exact format:
{
  "short_summary": "1-2 engaging sentences about what makes this place special (max 200 chars)",
  "full_description": "3-4 sentences with historical context, interesting facts, or local significance",
  "vibe": "comma-separated mood/atmosphere keywords for AI matching (e.g., 'historic landmark, peaceful retreat, photography spot, family-friendly')",
  "hints": ["hint for finding or recognizing the location", "another helpful hint"],
  "suggested_category": "one of: iconic, architecture, neighborhoods, hidden-gems, waterfront, parks",
  "historic_year": "founding or construction year if known, or null"
}`;

  const response = await callOpenAI(prompt, systemPrompt);

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error("Failed to parse AI response:", response);
    throw new Error("Invalid JSON response from AI");
  }
}

async function enrichFoodStop(record: any): Promise<FoodStopEnrichment> {
  const rawData = record.raw_data || {};
  const systemPrompt = `You are a San Francisco food critic and local guide. Generate engaging content for a food discovery app. Be concise but appetizing. Always respond with valid JSON.`;

  const neighborhood = getNeighborhoodFromCoords(record.lat, record.lng);

  const prompt = `Generate content for this San Francisco restaurant/café:

Name: ${record.name}
Type: ${rawData.type || "restaurant"}
Cuisine: ${record.cuisine || rawData.cuisine || "unknown"}
Neighborhood: ${neighborhood}
${rawData.opening_hours ? `Hours: ${rawData.opening_hours}` : ""}

Respond with JSON in this exact format:
{
  "short_summary": "1-2 appetizing sentences about the food or atmosphere (max 200 chars)",
  "vibe": "comma-separated atmosphere keywords (e.g., 'cozy brunch spot, cash only dive, late night eats, local favorite')",
  "price_range": "one of: $, $$, $$$",
  "recommendations": ["signature dish or drink", "another popular item", "third recommendation"]
}`;

  const response = await callOpenAI(prompt, systemPrompt);

  try {
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error("Failed to parse AI response:", response);
    throw new Error("Invalid JSON response from AI");
  }
}

// ============================================
// Main Processing
// ============================================

async function processRecords() {
  console.log("🤖 Golden Gate Quest - AI Enrichment\n");
  console.log("=".repeat(50));

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be saved\n");
  }

  // Query pending records
  let query = supabase
    .from("osm_imports")
    .select("*")
    .eq("enrichment_status", "pending")
    .not("name", "is", null)
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
    console.log("✅ No pending records to process");
    return;
  }

  console.log(`\n📋 Found ${records.length} records to enrich\n`);

  let processed = 0;
  let errors = 0;

  for (const record of records) {
    try {
      process.stdout.write(`Processing: ${record.name.substring(0, 40).padEnd(40)} `);

      const neighborhood = getNeighborhoodFromCoords(record.lat, record.lng);

      if (record.source_file === "restaurants") {
        // Enrich as food stop
        const enrichment = await enrichFoodStop(record);

        if (!DRY_RUN) {
          const { error: updateError } = await supabase
            .from("osm_imports")
            .update({
              short_summary: enrichment.short_summary,
              vibe: enrichment.vibe,
              price_range: enrichment.price_range,
              recommendations: enrichment.recommendations,
              neighborhood,
              enrichment_status: "enriched",
              enriched_at: new Date().toISOString(),
            })
            .eq("id", record.id);

          if (updateError) throw updateError;
        }

        console.log(`✅ ${enrichment.price_range}`);
      } else {
        // Enrich as location
        const enrichment = await enrichLocation(record);

        if (!DRY_RUN) {
          const { error: updateError } = await supabase
            .from("osm_imports")
            .update({
              short_summary: enrichment.short_summary,
              full_description: enrichment.full_description,
              vibe: enrichment.vibe,
              hints: enrichment.hints,
              suggested_category: enrichment.suggested_category,
              historic_year: enrichment.historic_year || record.historic_year,
              neighborhood,
              enrichment_status: "enriched",
              enriched_at: new Date().toISOString(),
            })
            .eq("id", record.id);

          if (updateError) throw updateError;
        }

        console.log(`✅ ${enrichment.suggested_category}`);
      }

      processed++;

      // Rate limiting - OpenAI has limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      console.log(`❌ Error`);
      console.error(`   ${err instanceof Error ? err.message : err}`);
      errors++;

      // Mark as failed to avoid retrying bad records
      if (!DRY_RUN) {
        await supabase
          .from("osm_imports")
          .update({ enrichment_status: "failed" })
          .eq("id", record.id);
      }

      // Continue with next record
      continue;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n✅ Enrichment complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Errors: ${errors}`);

  if (!DRY_RUN) {
    console.log("\nNext steps:");
    console.log("  1. Review enriched data in Supabase dashboard");
    console.log("  2. Run: npx tsx scripts/migrate-to-production.ts");
  }
}

// ============================================
// Run
// ============================================

processRecords().catch((err) => {
  console.error("\n❌ Enrichment failed:", err);
  process.exit(1);
});
