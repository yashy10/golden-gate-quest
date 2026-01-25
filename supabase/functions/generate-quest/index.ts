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

type AIProvider = "dgx" | "openai";

interface AIProviderConfig {
  url: string;
  model: string;
  getHeaders: () => Record<string, string>;
  supportsToolCalling: boolean;
}

function getAIProviderConfig(provider: AIProvider): AIProviderConfig {
  const NEMOTRON_URL = Deno.env.get("NEMOTRON_URL") || "http://192.168.128.247:8022";
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (provider === "dgx") {
    return {
      url: `${NEMOTRON_URL}/v1/chat/completions`,
      model: "nemotron-30b",
      getHeaders: () => ({
        "Content-Type": "application/json",
      }),
      supportsToolCalling: false,
    };
  }

  // Fallback: OpenAI direct
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    getHeaders: () => ({
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    }),
    supportsToolCalling: true,
  };
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ============================================
    // Step 1: Query locations with filters
    // ============================================
    const needsAccessibility = preferences.mobility === "limited";
    const priceFilter = mapBudgetToPriceRanges(preferences.budget);

    // Get locations filtered by category
    let query = supabase
      .from("locations")
      .select("*")
      .in("category", categories);
    
    if (needsAccessibility) {
      query = query.eq("accessibility", true);
    }

    const { data: availableLocations, error: locError } = await query.limit(30);

    if (locError) {
      console.error("Location query error:", locError);
      throw new Error(`Failed to query locations: ${locError.message}`);
    }

    console.log(`Found ${availableLocations?.length || 0} candidate locations`);

    // Get food stops
    let foodQuery = supabase.from("food_stops").select("*");
    if (priceFilter) {
      foodQuery = foodQuery.in("price_range", priceFilter);
    }

    const { data: availableFoodStops, error: foodError } = await foodQuery.limit(10);

    if (foodError) {
      console.error("Food stop query error:", foodError);
      throw new Error(`Failed to query food stops: ${foodError.message}`);
    }

    console.log(`Found ${availableFoodStops?.length || 0} candidate food stops`);

    if (!availableLocations || availableLocations.length < 5) {
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
    // Step 2: Use LLM to select optimal itinerary
    // ============================================
    
    // Try DGX first, fallback to OpenAI
    let aiProvider: AIProvider = "dgx";
    let providerConfig = getAIProviderConfig(aiProvider);
    let usedProvider: AIProvider = "dgx";

    const systemPrompt = `You are an expert San Francisco tour guide. Create the perfect personalized quest by selecting exactly 5 locations that would create the most enjoyable and cohesive experience.

Consider:
- User's preferences (age, budget, time, mobility, group size)
- Geographic proximity to minimize travel time
- A good narrative flow that tells a story of San Francisco
- Variety within the selected categories

Also select the best food stop that matches their budget and route.

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format, no other text:
{
  "locationIndices": [1, 2, 3, 4, 5],
  "foodStopIndex": 1,
  "questTheme": "Theme title here",
  "questDescription": "Description here"
}`;

    const userPrompt = `Create a personalized quest with these parameters:

User Preferences:
- Age Range: ${preferences.ageRange}
- Budget: ${preferences.budget}
- Time Available: ${preferences.timeAvailable}
- Mobility: ${preferences.mobility}
- Group Size: ${preferences.groupSize}
- Starting Point: ${preferences.startingPoint.type === "address" ? preferences.startingPoint.value : "Current location"}

Selected Categories: ${categories.join(", ")}

Available Locations (pick exactly 5 by their number):
${availableLocations
  .map(
    (loc: any, i: number) =>
      `${i + 1}. ${loc.name} (${loc.neighborhood}) - ${loc.category}
   Vibe: ${loc.vibe || "N/A"}
   Summary: ${loc.short_summary || "A notable San Francisco location"}`
  )
  .join("\n\n")}

Available Food Stops (pick 1 by its number):
${(availableFoodStops || [])
  .map(
    (fs: any, i: number) =>
      `${i + 1}. ${fs.name} (${fs.cuisine}, ${fs.price_range}) in ${fs.neighborhood}
   Vibe: ${fs.vibe || "N/A"}`
  )
  .join("\n\n")}

Respond with ONLY the JSON object containing locationIndices (array of 5 numbers), foodStopIndex (1 number), questTheme (string), and questDescription (string).`;

    let questData: any;

    // Try DGX first
    try {
      console.log(`Calling DGX at ${providerConfig.url}`);
      
      const response = await fetch(providerConfig.url, {
        method: "POST",
        headers: providerConfig.getHeaders(),
        body: JSON.stringify({
          model: providerConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DGX API error:", response.status, errorText);
        throw new Error(`DGX API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || "";
      console.log("DGX response:", content);

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questData = JSON.parse(jsonMatch[0]);
        usedProvider = "dgx";
      } else {
        throw new Error("No JSON found in DGX response");
      }
    } catch (dgxError) {
      console.error("DGX failed, falling back to OpenAI:", dgxError);
      
      // Fallback to OpenAI
      aiProvider = "openai";
      providerConfig = getAIProviderConfig(aiProvider);
      
      try {
        console.log(`Calling OpenAI at ${providerConfig.url}`);
        
        const response = await fetch(providerConfig.url, {
          method: "POST",
          headers: providerConfig.getHeaders(),
          body: JSON.stringify({
            model: providerConfig.model,
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
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
              {
                status: 402,
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
          throw new Error("Unexpected OpenAI response format");
        }

        questData = JSON.parse(toolCall.function.arguments);
        usedProvider = "openai";
      } catch (openaiError) {
        console.error("OpenAI also failed:", openaiError);
        
        // Ultimate fallback: random selection
        questData = {
          locationIndices: [1, 2, 3, 4, 5].slice(0, Math.min(5, availableLocations.length)),
          foodStopIndex: 1,
          questTheme: "San Francisco Discovery",
          questDescription: "A curated journey through the best of San Francisco.",
        };
        usedProvider = "openai"; // Mark as fallback
      }
    }

    console.log("AI selected:", questData, "via", usedProvider);

    // ============================================
    // Step 3: Build the quest response
    // ============================================
    const selectedLocations = (questData.locationIndices || [1, 2, 3, 4, 5])
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

    const selectedFoodStop = availableFoodStops && availableFoodStops.length > 0
      ? (availableFoodStops[questData.foodStopIndex - 1] ||
         availableFoodStops[Math.floor(Math.random() * availableFoodStops.length)])
      : null;

    // Convert to app format
    const quest = {
      id: `quest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      preferences,
      categories,
      locations: selectedLocations.map(dbToAppLocation),
      foodStop: selectedFoodStop ? dbToAppFoodStop(selectedFoodStop) : null,
      theme: questData.questTheme || "San Francisco Adventure",
      description: questData.questDescription || "Explore the best of San Francisco!",
      aiProvider: usedProvider,
      progress: {
        currentIndex: 0,
        completed: new Array(selectedLocations.length).fill(false),
        photos: new Array(selectedLocations.length).fill(""),
      },
    };

    console.log("Generated quest:", quest.id, quest.theme, "via", usedProvider);

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
    vibe: dbLoc.vibe || "",
    accessibility: dbLoc.accessibility || false,
    bestTimeOfDay: dbLoc.best_time_of_day || [],
    durationMinutes: dbLoc.duration_minutes || 30,
    difficulty: dbLoc.difficulty || "easy",
    tags: dbLoc.tags || [],
  };
}

function dbToAppFoodStop(dbFs: any) {
  return {
    id: dbFs.id,
    name: dbFs.name,
    cuisine: dbFs.cuisine,
    priceRange: dbFs.price_range,
    neighborhood: dbFs.neighborhood,
    coordinates: { lat: Number(dbFs.lat), lng: Number(dbFs.lng) },
    recommendations: dbFs.recommendations || [],
    image: dbFs.image || "",
    vibe: dbFs.vibe || "",
    dietaryOptions: dbFs.dietary_options || [],
  };
}
