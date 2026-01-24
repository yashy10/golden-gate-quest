import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserPreferences {
  ageRange: string;
  budget: string;
  startingPoint: { type: 'current' | 'address'; value?: string };
  timeAvailable: string;
  mobility: string;
  groupSize: string;
}

interface Location {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  coordinates: { lat: number; lng: number };
  category: string;
  heroImage: string;
  historicImage: string;
  historicYear: string;
  shortSummary: string;
  fullDescription: string;
  hints: string[];
}

interface FoodStop {
  id: string;
  name: string;
  cuisine: string;
  priceRange: string;
  neighborhood: string;
  coordinates: { lat: number; lng: number };
  recommendations: string[];
  image: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categories, preferences, allLocations, foodStops } = await req.json();
    
    console.log("Generating quest for categories:", categories);
    console.log("User preferences:", preferences);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Filter locations by selected categories
    const availableLocations = allLocations.filter((loc: Location) =>
      categories.includes(loc.category)
    );

    // Create a prompt for the AI to curate the best quest
    const systemPrompt = `You are an expert San Francisco tour guide and travel curator. Your job is to create the perfect personalized quest for visitors based on their preferences.

Given a list of available locations and user preferences, select exactly 5 locations that would create the most enjoyable and cohesive experience. Consider:
- The user's age range and interests
- Budget constraints
- Time available (half-day, full-day, multi-day)
- Mobility requirements (walking-friendly, transit-accessible)
- Group size and dynamics
- Geographic proximity to minimize travel time
- A good narrative flow that tells the story of San Francisco

Also select the best food stop that matches their budget and would be conveniently located along their route.`;

    const userPrompt = `Create a personalized quest with these parameters:

User Preferences:
- Age Range: ${preferences.ageRange}
- Budget: ${preferences.budget}
- Time Available: ${preferences.timeAvailable}
- Mobility: ${preferences.mobility}
- Group Size: ${preferences.groupSize}
- Starting Point: ${preferences.startingPoint.type === 'address' ? preferences.startingPoint.value : 'Current location'}

Selected Categories: ${categories.join(', ')}

Available Locations (pick exactly 5):
${availableLocations.map((loc: Location, i: number) => 
  `${i + 1}. ${loc.name} (${loc.neighborhood}) - ${loc.category}: ${loc.shortSummary}`
).join('\n')}

Available Food Stops (pick 1 that best matches their budget and route):
${foodStops.map((fs: FoodStop, i: number) => 
  `${i + 1}. ${fs.name} (${fs.cuisine}, ${fs.priceRange}) in ${fs.neighborhood}`
).join('\n')}

Return your selections using the tool provided.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_quest",
              description: "Create a curated quest with selected locations and food stop",
              parameters: {
                type: "object",
                properties: {
                  locationIndices: {
                    type: "array",
                    items: { type: "number" },
                    description: "Array of 5 indices (1-based) from the available locations list, ordered for the best route"
                  },
                  foodStopIndex: {
                    type: "number",
                    description: "Index (1-based) of the selected food stop"
                  },
                  questTheme: {
                    type: "string",
                    description: "A catchy theme or title for this quest (e.g., 'Hidden Treasures of the Mission', 'Waterfront Wonders')"
                  },
                  questDescription: {
                    type: "string",
                    description: "A brief personalized description of why these locations were chosen for this user"
                  }
                },
                required: ["locationIndices", "foodStopIndex", "questTheme", "questDescription"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_quest" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response:", JSON.stringify(aiResponse, null, 2));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "create_quest") {
      console.error("Unexpected AI response format");
      throw new Error("Failed to generate quest - unexpected response format");
    }

    const questData = JSON.parse(toolCall.function.arguments);
    console.log("Quest data:", questData);

    // Map indices to actual locations (convert 1-based to 0-based)
    const selectedLocations = questData.locationIndices
      .map((idx: number) => availableLocations[idx - 1])
      .filter(Boolean)
      .slice(0, 5);

    // Ensure we have exactly 5 locations (fallback to random if AI gave bad indices)
    while (selectedLocations.length < 5 && availableLocations.length > selectedLocations.length) {
      const remaining = availableLocations.filter(
        (loc: Location) => !selectedLocations.some((sel: Location) => sel.id === loc.id)
      );
      if (remaining.length > 0) {
        selectedLocations.push(remaining[Math.floor(Math.random() * remaining.length)]);
      }
    }

    // Get the food stop
    const selectedFoodStop = foodStops[questData.foodStopIndex - 1] || 
      foodStops[Math.floor(Math.random() * foodStops.length)];

    const quest = {
      id: `quest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      preferences,
      categories,
      locations: selectedLocations,
      foodStop: selectedFoodStop,
      theme: questData.questTheme,
      description: questData.questDescription,
      progress: {
        currentIndex: 0,
        completed: new Array(selectedLocations.length).fill(false),
        photos: new Array(selectedLocations.length).fill(''),
      },
    };

    console.log("Generated quest:", quest.id, quest.theme);

    return new Response(JSON.stringify(quest), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating quest:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate quest" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
