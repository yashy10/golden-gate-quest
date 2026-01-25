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

async function tryDGX(requestBody: any, providerConfig: AIProviderConfig): Promise<any> {
  const response = await fetch(providerConfig.url, {
    method: "POST",
    headers: providerConfig.getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DGX API error:", response.status, errorText);
    throw new Error(`DGX API error: ${response.status}`);
  }

  return await response.json();
}

async function tryOpenAI(requestBody: any, providerConfig: AIProviderConfig): Promise<any> {
  const response = await fetch(providerConfig.url, {
    method: "POST",
    headers: providerConfig.getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (response.status === 402) {
      throw new Error("PAYMENT_REQUIRED");
    }
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ItineraryRequest = await req.json();
    console.log("Received request:", JSON.stringify(requestData, null, 2));

    const { type, messages = [], categories, preferences, availableLocations, availableFoodStops, currentItineraries } = requestData;

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

    // Try DGX first, fallback to OpenAI
    let aiProvider: AIProvider = "dgx";
    let providerConfig = getAIProviderConfig(aiProvider);
    let usedProvider = "dgx";

    const jsonInstructions = `

IMPORTANT: You must respond with ONLY a valid JSON object, no markdown, no code blocks, no other text.`;

    if (type === "generate") {
      const systemPrompt = baseContext + jsonInstructions;
      const userPrompt = `Generate two distinct and diverse itinerary options for this San Francisco quest.

Each option should have:
- A unique theme and feel
- 5 carefully selected locations that flow well together
- 1 food stop that matches the budget and route
- Different vibes (e.g., one more adventurous, one more relaxed; one more touristy, one more local)

Respond with ONLY this JSON format:
{
  "option1": {
    "theme": "Theme name",
    "description": "Brief description",
    "locationIndices": [1, 2, 3, 4, 5],
    "foodStopIndex": 1
  },
  "option2": {
    "theme": "Theme name",
    "description": "Brief description",
    "locationIndices": [1, 2, 3, 4, 5],
    "foodStopIndex": 1
  }
}`;

      let aiResponse: any;
      
      try {
        console.log(`Trying DGX at ${providerConfig.url}`);
        aiResponse = await tryDGX({
          model: providerConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }, providerConfig);
        usedProvider = "dgx";
      } catch (dgxError) {
        console.error("DGX failed, falling back to OpenAI:", dgxError);
        aiProvider = "openai";
        providerConfig = getAIProviderConfig(aiProvider);
        
        try {
          console.log(`Trying OpenAI at ${providerConfig.url}`);
          aiResponse = await tryOpenAI({
            model: providerConfig.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
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
          }, providerConfig);
          usedProvider = "openai";
        } catch (openaiError: any) {
          if (openaiError.message === "RATE_LIMIT") {
            return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (openaiError.message === "PAYMENT_REQUIRED") {
            return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw openaiError;
        }
      }

      console.log(`AI response from ${usedProvider}:`, JSON.stringify(aiResponse, null, 2));

      let functionArgs: any;
      
      // Handle tool calling response (OpenAI)
      const message = aiResponse.choices?.[0]?.message;
      if (message?.tool_calls?.[0]) {
        const toolCall = message.tool_calls[0];
        functionArgs = JSON.parse(toolCall.function.arguments);
      } else if (message?.content) {
        // Handle plain text response (DGX/Nemotron)
        const content = message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          functionArgs = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } else {
        throw new Error("Unexpected AI response format");
      }

      return new Response(JSON.stringify({
        type: "itineraries",
        data: functionArgs,
        provider: usedProvider
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // Chat mode
      const systemPrompt = baseContext + "\n\nWhen chatting, be helpful and confirm any changes you make to the itineraries. Respond with JSON when making updates, or plain text for conversation.";
      
      let aiResponse: any;
      
      try {
        console.log(`Trying DGX for chat at ${providerConfig.url}`);
        aiResponse = await tryDGX({
          model: providerConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }, providerConfig);
        usedProvider = "dgx";
      } catch (dgxError) {
        console.error("DGX failed for chat, falling back to OpenAI:", dgxError);
        aiProvider = "openai";
        providerConfig = getAIProviderConfig(aiProvider);
        
        try {
          aiResponse = await tryOpenAI({
            model: providerConfig.model,
            messages: [
              { role: "system", content: systemPrompt },
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
          }, providerConfig);
          usedProvider = "openai";
        } catch (openaiError: any) {
          if (openaiError.message === "RATE_LIMIT") {
            return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw openaiError;
        }
      }

      console.log(`Chat response from ${usedProvider}:`, JSON.stringify(aiResponse, null, 2));

      const message = aiResponse.choices?.[0]?.message;

      if (message?.tool_calls?.[0]) {
        const toolCall = message.tool_calls[0];
        const functionArgs = JSON.parse(toolCall.function.arguments);

        return new Response(JSON.stringify({
          type: "update",
          data: functionArgs,
          provider: usedProvider
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else if (message?.content) {
        // Check if DGX response contains JSON for updates
        const content = message.content;
        const jsonMatch = content.match(/\{[\s\S]*"option1"[\s\S]*\}|\{[\s\S]*"option2"[\s\S]*\}|\{[\s\S]*"chatResponse"[\s\S]*\}/);
        
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify({
              type: "update",
              data: parsed,
              provider: usedProvider
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } catch {
            // Not valid JSON, treat as chat response
          }
        }
        
        return new Response(JSON.stringify({
          type: "chat",
          data: { chatResponse: content },
          provider: usedProvider
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("Unexpected AI response format");
    }

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
