import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ItineraryRequest {
  type: "generate" | "chat";
  messages?: Message[];
  categories: string[];
  preferences: {
    ageRange: string;
    budget: string;
    timeAvailable: string;
    mobility: string;
    groupSize: string;
  };
  availableLocations: Array<{
    index: number;
    name: string;
    neighborhood: string;
    category: string;
    shortSummary: string;
  }>;
  availableFoodStops: Array<{
    index: number;
    name: string;
    cuisine: string;
    priceRange: string;
    neighborhood: string;
  }>;
  currentItineraries?: {
    option1: ItineraryOption | null;
    option2: ItineraryOption | null;
  };
}

interface ItineraryOption {
  theme: string;
  description: string;
  locationIndices: number[];
  foodStopIndex: number;
}

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ItineraryRequest = await req.json();
    console.log("Received request:", JSON.stringify(requestData, null, 2));

    const { type, messages = [], categories, preferences, availableLocations, availableFoodStops, currentItineraries } = requestData;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Using Lovable AI Gateway with model: ${MODEL}`);

    const baseContext = `You are an expert San Francisco tour guide and travel curator. You help create personalized quests/itineraries.

Available Locations (use these indices when selecting):
${availableLocations.map(loc => `${loc.index}. ${loc.name} (${loc.neighborhood}) - ${loc.category}: ${loc.shortSummary}`).join('\n')}

Available Food Stops (use these indices when selecting):
${availableFoodStops.map(fs => `${fs.index}. ${fs.name} (${fs.cuisine}, ${fs.priceRange}) in ${fs.neighborhood}`).join('\n')}

User Preferences:
- Age Range: ${preferences.ageRange}
- Budget: ${preferences.budget}
- Time Available: ${preferences.timeAvailable}
- Mobility: ${preferences.mobility}
- Group Size: ${preferences.groupSize}
- Selected Categories: ${categories.join(', ')}

${currentItineraries ? `Current Itineraries:
Option 1: ${currentItineraries.option1 ? `${currentItineraries.option1.theme} - Locations: ${currentItineraries.option1.locationIndices.join(', ')}, Food Stop: ${currentItineraries.option1.foodStopIndex}` : 'Not generated yet'}
Option 2: ${currentItineraries.option2 ? `${currentItineraries.option2.theme} - Locations: ${currentItineraries.option2.locationIndices.join(', ')}, Food Stop: ${currentItineraries.option2.foodStopIndex}` : 'Not generated yet'}
` : ''}`;

    let requestBody: Record<string, unknown>;

    if (type === "generate") {
      requestBody = {
        model: MODEL,
        messages: [
          { role: "system", content: baseContext + "\n\nWhen generating or modifying itineraries, always respond with valid JSON using the tools provided." },
          {
            role: "user",
            content: `Generate two distinct and diverse itinerary options for this San Francisco quest.

Each option should have:
- A unique theme and feel
- 5 carefully selected locations that flow well together
- 1 food stop that matches the budget and route
- Different vibes (e.g., one more adventurous, one more relaxed; one more touristy, one more local)

Make sure the two options are meaningfully different so the user has a real choice.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_itinerary_options",
              description: "Create two distinct itinerary options for the user to choose from",
              parameters: {
                type: "object",
                properties: {
                  option1: {
                    type: "object",
                    properties: {
                      theme: { type: "string", description: "Catchy theme name for this itinerary" },
                      description: { type: "string", description: "Brief description of the vibe and why these locations work together" },
                      locationIndices: {
                        type: "array",
                        items: { type: "number" },
                        description: "Array of 5 location indices in optimal order"
                      },
                      foodStopIndex: { type: "number", description: "Index of the recommended food stop" }
                    },
                    required: ["theme", "description", "locationIndices", "foodStopIndex"]
                  },
                  option2: {
                    type: "object",
                    properties: {
                      theme: { type: "string", description: "Catchy theme name for this itinerary" },
                      description: { type: "string", description: "Brief description of the vibe and why these locations work together" },
                      locationIndices: {
                        type: "array",
                        items: { type: "number" },
                        description: "Array of 5 location indices in optimal order"
                      },
                      foodStopIndex: { type: "number", description: "Index of the recommended food stop" }
                    },
                    required: ["theme", "description", "locationIndices", "foodStopIndex"]
                  }
                },
                required: ["option1", "option2"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_itinerary_options" } }
      };
    } else {
      // Chat mode with tools
      requestBody = {
        model: MODEL,
        messages: [
          { role: "system", content: baseContext + "\n\nWhen chatting, be helpful and confirm any changes you make to the itineraries." },
          ...messages
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "update_itinerary",
              description: "Update one or both itinerary options based on user request",
              parameters: {
                type: "object",
                properties: {
                  option1: {
                    type: "object",
                    description: "Updated option 1 (only include if changing)",
                    properties: {
                      theme: { type: "string" },
                      description: { type: "string" },
                      locationIndices: { type: "array", items: { type: "number" } },
                      foodStopIndex: { type: "number" }
                    }
                  },
                  option2: {
                    type: "object",
                    description: "Updated option 2 (only include if changing)",
                    properties: {
                      theme: { type: "string" },
                      description: { type: "string" },
                      locationIndices: { type: "array", items: { type: "number" } },
                      foodStopIndex: { type: "number" }
                    }
                  },
                  chatResponse: {
                    type: "string",
                    description: "Your response to the user explaining changes or answering their question"
                  }
                },
                required: ["chatResponse"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: "auto"
      };
    }

    console.log("Sending request to Lovable AI:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`Lovable AI error: ${response.status} ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log("AI response:", JSON.stringify(aiResponse, null, 2));

    const message = aiResponse.choices?.[0]?.message;

    if (message?.tool_calls?.[0]) {
      const toolCall = message.tool_calls[0];
      const functionArgs = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify({
        type: type === "generate" ? "itineraries" : "update",
        data: functionArgs
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (message?.content) {
      return new Response(JSON.stringify({
        type: "chat",
        data: { chatResponse: message.content }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unexpected AI response format");

  } catch (error) {
    console.error("chat-itinerary error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
