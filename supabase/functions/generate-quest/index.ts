import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserPreferences {
  ageRange: string;
  budget: string;
  startingPoint: { type: "current" | "address"; value?: string };
  timeAvailable: string;
  mobility: string;
  groupSize: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categories, preferences } = (await req.json()) as {
      categories: string[];
      preferences: UserPreferences;
    };

    console.log("Generating quest for categories:", categories);
    console.log("User preferences:", preferences);

    // Get environment variables
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ============================================
    // Step 1: Create embedding for user preferences
    // ============================================
    const preferenceText = buildPreferenceText(preferences, categories);
    console.log("Preference text for embedding:", preferenceText);

    const embeddingResponse = await fetch(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: preferenceText,
        }),
      }
    );

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      console.error("Embedding error:", error);
      throw new Error(`Failed to generate embedding: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // ============================================
    // Step 2: Query locations with vector similarity + filters
    // ============================================
    const needsAccessibility = preferences.mobility === "limited";
    const priceFilter = mapBudgetToPriceRanges(preferences.budget);

    // Get semantically similar locations filtered by category
    const { data: candidateLocations, error: locError } = await supabase.rpc(
      "match_locations",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3, // Lower threshold to get more candidates
        match_count: 30,
        filter_categories: categories,
        filter_accessible: needsAccessibility ? true : null,
        filter_neighborhoods: null,
      }
    );

    if (locError) {
      console.error("Location query error:", locError);
      throw new Error(`Failed to query locations: ${locError.message}`);
    }

    console.log(`Found ${candidateLocations?.length || 0} candidate locations`);

    // Get semantically similar food stops
    const { data: candidateFoodStops, error: foodError } = await supabase.rpc(
      "match_food_stops",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 10,
        filter_price_ranges: priceFilter,
        filter_neighborhoods: null,
      }
    );

    if (foodError) {
      console.error("Food stop query error:", foodError);
      throw new Error(`Failed to query food stops: ${foodError.message}`);
    }

    console.log(`Found ${candidateFoodStops?.length || 0} candidate food stops`);

    // Fallback: if no results from vector search, get all locations in categories
    let availableLocations = candidateLocations || [];
    let availableFoodStops = candidateFoodStops || [];

    if (availableLocations.length === 0) {
      console.log("Falling back to category-only filter");
      const { data: fallbackLocs } = await supabase
        .from("locations")
        .select("*")
        .in("category", categories);
      availableLocations = fallbackLocs || [];
    }

    if (availableFoodStops.length === 0) {
      console.log("Falling back to all food stops");
      const { data: fallbackFood } = await supabase
        .from("food_stops")
        .select("*");
      availableFoodStops = fallbackFood || [];
    }

    if (availableLocations.length < 5) {
      console.error("Not enough locations found");
      return new Response(
        JSON.stringify({
          error: "Not enough locations found for selected categories",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ============================================
    // Step 3: Use LLM to select optimal itinerary
    // ============================================
    const systemPrompt = `You are an expert San Francisco tour guide. Create the perfect personalized quest by selecting exactly 5 locations that would create the most enjoyable and cohesive experience.

Consider:
- User's preferences (age, budget, time, mobility, group size)
- Semantic similarity scores (higher = better match to user's vibe)
- Geographic proximity to minimize travel time
- A good narrative flow that tells a story of San Francisco
- Variety within the selected categories

Also select the best food stop that matches their budget and route.`;

    const userPrompt = `Create a personalized quest with these parameters:

User Preferences:
- Age Range: ${preferences.ageRange}
- Budget: ${preferences.budget}
- Time Available: ${preferences.timeAvailable}
- Mobility: ${preferences.mobility}
- Group Size: ${preferences.groupSize}
- Starting Point: ${preferences.startingPoint.type === "address" ? preferences.startingPoint.value : "Current location"}

Selected Categories: ${categories.join(", ")}

Available Locations (ranked by semantic similarity, pick exactly 5):
${availableLocations
  .map(
    (loc: any, i: number) =>
      `${i + 1}. ${loc.name} (${loc.neighborhood}) - ${loc.category} [similarity: ${(loc.similarity * 100).toFixed(1)}%]
   Vibe: ${loc.vibe || "N/A"}
   Summary: ${loc.short_summary}`
  )
  .join("\n\n")}

Available Food Stops (pick 1):
${availableFoodStops
  .map(
    (fs: any, i: number) =>
      `${i + 1}. ${fs.name} (${fs.cuisine}, ${fs.price_range}) in ${fs.neighborhood} [similarity: ${(fs.similarity * 100).toFixed(1)}%]
   Vibe: ${fs.vibe || "N/A"}`
  )
  .join("\n\n")}

Select locations that create a cohesive experience matching the user's vibe.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_quest",
              description:
                "Create a curated quest with selected locations and food stop",
              parameters: {
                type: "object",
                properties: {
                  locationIndices: {
                    type: "array",
                    items: { type: "number" },
                    description:
                      "Array of 5 indices (1-based) from the available locations list, ordered for the best route",
                  },
                  foodStopIndex: {
                    type: "number",
                    description: "Index (1-based) of the selected food stop",
                  },
                  questTheme: {
                    type: "string",
                    description:
                      "A catchy theme or title for this quest (e.g., 'Hidden Treasures of the Mission')",
                  },
                  questDescription: {
                    type: "string",
                    description:
                      "A brief personalized description of why these locations were chosen",
                  },
                },
                required: [
                  "locationIndices",
                  "foodStopIndex",
                  "questTheme",
                  "questDescription",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_quest" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "create_quest") {
      throw new Error("Unexpected AI response format");
    }

    const questData = JSON.parse(toolCall.function.arguments);
    console.log("AI selected:", questData);

    // ============================================
    // Step 4: Build the quest response
    // ============================================
    const selectedLocations = questData.locationIndices
      .map((idx: number) => availableLocations[idx - 1])
      .filter(Boolean)
      .slice(0, 5);

    // Ensure we have exactly 5 locations
    while (
      selectedLocations.length < 5 &&
      availableLocations.length > selectedLocations.length
    ) {
      const remaining = availableLocations.filter(
        (loc: any) =>
          !selectedLocations.some((sel: any) => sel.id === loc.id)
      );
      if (remaining.length > 0) {
        selectedLocations.push(
          remaining[Math.floor(Math.random() * remaining.length)]
        );
      }
    }

    const selectedFoodStop =
      availableFoodStops[questData.foodStopIndex - 1] ||
      availableFoodStops[Math.floor(Math.random() * availableFoodStops.length)];

    // Convert to app format
    const quest = {
      id: `quest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      preferences,
      categories,
      locations: selectedLocations.map(dbToAppLocation),
      foodStop: dbToAppFoodStop(selectedFoodStop),
      theme: questData.questTheme,
      description: questData.questDescription,
      aiProvider: "openai",
      progress: {
        currentIndex: 0,
        completed: new Array(selectedLocations.length).fill(false),
        photos: new Array(selectedLocations.length).fill(""),
      },
    };

    console.log("Generated quest:", quest.id, quest.theme);

    return new Response(JSON.stringify(quest), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating quest:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate quest",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ============================================
// Helper Functions
// ============================================

function buildPreferenceText(
  preferences: UserPreferences,
  categories: string[]
): string {
  const parts = [];

  // Age-based preferences
  if (preferences.ageRange === "18-25") {
    parts.push("young adult adventure, instagram-worthy spots, trendy locations");
  } else if (preferences.ageRange === "26-35") {
    parts.push("urban exploration, cultural experiences, craft food and drinks");
  } else if (preferences.ageRange === "36-50") {
    parts.push("curated experiences, history and architecture, quality dining");
  } else if (preferences.ageRange === "50+") {
    parts.push("accessible locations, classic landmarks, comfortable pace");
  }

  // Budget preferences
  if (preferences.budget === "budget") {
    parts.push("free attractions, affordable eats, hidden gems");
  } else if (preferences.budget === "moderate") {
    parts.push("good value experiences, local favorites, balanced options");
  } else if (preferences.budget === "splurge") {
    parts.push("premium experiences, upscale dining, exclusive spots");
  }

  // Time preferences
  if (preferences.timeAvailable === "half-day") {
    parts.push("quick highlights, concentrated area, efficient route");
  } else if (preferences.timeAvailable === "full-day") {
    parts.push("comprehensive tour, multiple neighborhoods, varied experiences");
  } else if (preferences.timeAvailable === "multi-day") {
    parts.push("deep exploration, off-the-beaten-path, local secrets");
  }

  // Mobility
  if (preferences.mobility === "limited") {
    parts.push("wheelchair accessible, minimal walking, flat terrain");
  } else {
    parts.push("walking friendly, stairs ok, active exploration");
  }

  // Group size
  if (preferences.groupSize === "solo") {
    parts.push("solo traveler friendly, contemplative spots, people watching");
  } else if (preferences.groupSize === "couple") {
    parts.push("romantic spots, scenic views, intimate settings");
  } else if (preferences.groupSize === "small-group") {
    parts.push("group friendly, photo opportunities, shared experiences");
  } else if (preferences.groupSize === "family") {
    parts.push("family friendly, kid-approved, educational and fun");
  }

  // Categories
  parts.push(`interested in: ${categories.join(", ")}`);

  return parts.join(" | ");
}

function mapBudgetToPriceRanges(budget: string): string[] | null {
  switch (budget) {
    case "budget":
      return ["$"];
    case "moderate":
      return ["$", "$$"];
    case "splurge":
      return ["$$", "$$$"];
    default:
      return null;
  }
}

function dbToAppLocation(dbLoc: any) {
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

function dbToAppFoodStop(dbFood: any) {
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
