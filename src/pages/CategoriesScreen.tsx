import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Shuffle } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import CategoryCard from '@/components/CategoryCard';
import { categoryInfo, Category, allLocations, foodStops, UserPreferences, Quest } from '@/data/locations';
import Confetti from '@/components/Confetti';
import { useToast } from '@/hooks/use-toast';

const CategoriesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedCategories, toggleCategory, preferences, setQuest } = useQuestStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMinConfetti, setShowMinConfetti] = useState(false);
  const [prevCount, setPrevCount] = useState(selectedCategories.length);

  const categories = Object.entries(categoryInfo) as [Category, typeof categoryInfo[Category]][];

  // Show micro-confetti when 2nd category is selected
  useEffect(() => {
    if (selectedCategories.length === 2 && prevCount === 1) {
      setShowMinConfetti(true);
      setTimeout(() => setShowMinConfetti(false), 1500);
    }
    setPrevCount(selectedCategories.length);
  }, [selectedCategories.length, prevCount]);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Build full preferences
      const fullPreferences: UserPreferences = {
        ageRange: preferences.ageRange || '18-30',
        budget: preferences.budget || 'moderate',
        startingPoint: preferences.startingPoint || { type: 'current' },
        timeAvailable: preferences.timeAvailable || 'half-day',
        mobility: preferences.mobility || 'anywhere',
        groupSize: preferences.groupSize || 'solo',
      };

      // Filter locations by selected categories
      const availableLocations = allLocations.filter(loc =>
        selectedCategories.includes(loc.category)
      );

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
- Age Range: ${fullPreferences.ageRange}
- Budget: ${fullPreferences.budget}
- Time Available: ${fullPreferences.timeAvailable}
- Mobility: ${fullPreferences.mobility}
- Group Size: ${fullPreferences.groupSize}
- Starting Point: ${fullPreferences.startingPoint.type === 'address' ? fullPreferences.startingPoint.value : 'Current location'}

Selected Categories: ${selectedCategories.join(', ')}

Available Locations (pick exactly 5):
${availableLocations.map((loc, i) =>
  `${i + 1}. ${loc.name} (${loc.neighborhood}) - ${loc.category}: ${loc.shortSummary}`
).join('\n')}

Available Food Stops (pick 1 that best matches their budget and route):
${foodStops.map((fs, i) =>
  `${i + 1}. ${fs.name} (${fs.cuisine}, ${fs.priceRange}) in ${fs.neighborhood}`
).join('\n')}

Return your selections using the tool provided.`;

      // Determine which LLM provider to use
      const llmProvider = import.meta.env.VITE_LLM_PROVIDER || 'openai';
      const isDGX = llmProvider === 'dgx';

      // Use proxy for DGX to avoid CORS issues
      const apiUrl = isDGX
        ? '/api/dgx/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add Authorization header for OpenAI
      if (!isDGX) {
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`;
      }

      // Build request body based on provider
      const requestBody: Record<string, unknown> = {
        model: isDGX ? 'nemotron-3n' : 'gpt-4o-mini',
        // DGX nemotron-3n has 2000 total context limit (input + output)
        // With ~300 input tokens, we can use ~1600 for output
        max_tokens: isDGX ? 1600 : 1000,
      };

      if (isDGX) {
        // DGX/Nemotron: reasoning model will think first, then output JSON
        // We give it enough tokens to complete reasoning AND produce JSON at the end
        const dgxSystemPrompt = `You are a helpful assistant that outputs JSON. After any reasoning, you MUST end your response with a valid JSON object.`;

        const dgxUserPrompt = `Select 5 locations and 1 food stop for a San Francisco quest.

User: ${fullPreferences.ageRange}, ${fullPreferences.budget} budget, ${fullPreferences.timeAvailable}, ${fullPreferences.mobility} mobility, ${fullPreferences.groupSize}
Categories: ${selectedCategories.join(', ')}

Locations (pick 5 indices):
${availableLocations.map((loc, i) => `${i + 1}. ${loc.name} (${loc.neighborhood})`).join('\n')}

Food Stops (pick 1 index):
${foodStops.map((fs, i) => `${i + 1}. ${fs.name} (${fs.cuisine}, ${fs.priceRange})`).join('\n')}

After your analysis, output EXACTLY this JSON format at the end:
{"locationIndices": [1, 2, 3, 4, 5], "foodStopIndex": 1, "questTheme": "Theme Name Here", "questDescription": "Brief description here"}`;

        requestBody.messages = [
          { role: 'system', content: dgxSystemPrompt },
          { role: 'user', content: dgxUserPrompt },
        ];
        // Request JSON output format (supported by OpenAI-compatible APIs)
        requestBody.response_format = { type: 'json_object' };
      } else {
        // OpenAI supports tools
        requestBody.messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];
        requestBody.tools = [
          {
            type: 'function',
            function: {
              name: 'create_quest',
              description: 'Create a curated quest with selected locations and food stop',
              parameters: {
                type: 'object',
                properties: {
                  locationIndices: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Array of 5 indices (1-based) from the available locations list, ordered for the best route'
                  },
                  foodStopIndex: {
                    type: 'number',
                    description: 'Index (1-based) of the selected food stop'
                  },
                  questTheme: {
                    type: 'string',
                    description: "A catchy theme or title for this quest (e.g., 'Hidden Treasures of the Mission', 'Waterfront Wonders')"
                  },
                  questDescription: {
                    type: 'string',
                    description: 'A brief personalized description of why these locations were chosen for this user'
                  }
                },
                required: ['locationIndices', 'foodStopIndex', 'questTheme', 'questDescription'],
                additionalProperties: false
              }
            }
          }
        ];
        requestBody.tool_choice = { type: 'function', function: { name: 'create_quest' } };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('LLM request failed:', {
          provider: isDGX ? 'dgx' : 'openai',
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        if (response.status === 429) {
          toast({
            title: "Too many requests",
            description: errorText || "Please wait a moment and try again.",
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        } else if (response.status === 401) {
          toast({
            title: "API key invalid",
            description: errorText || "Please check your API key.",
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        }
        throw new Error(errorText || `Failed to generate quest (HTTP ${response.status})`);
      }

      const aiResponse = await response.json();
      console.log('LLM response:', JSON.stringify(aiResponse, null, 2));

      let questData;
      if (isDGX) {
        // Parse JSON from DGX response content
        // Reasoning models output thinking first, then JSON at the end
        const content = aiResponse.choices?.[0]?.message?.content || '';
        console.log('DGX content to parse:', content);

        // Find the LAST JSON object in the response (reasoning models put it at the end)
        const jsonMatches = content.match(/\{[^{}]*"locationIndices"\s*:\s*\[[^\]]+\][^{}]*\}/g);
        const jsonStr = jsonMatches ? jsonMatches[jsonMatches.length - 1] : null;

        if (!jsonStr) {
          console.error('DGX response content did not contain valid JSON with locationIndices:', content);
          throw new Error('Could not parse quest data from DGX response.');
        }

        questData = JSON.parse(jsonStr);
        console.log('Parsed quest data:', questData);
      } else {
        // Parse from OpenAI tool call
        const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall || toolCall.function.name !== 'create_quest') {
          throw new Error('Unexpected AI response format');
        }
        questData = JSON.parse(toolCall.function.arguments);
      }


      // Map indices to actual locations (convert 1-based to 0-based)
      let selectedLocations = questData.locationIndices
        .map((idx: number) => availableLocations[idx - 1])
        .filter(Boolean)
        .slice(0, 5);

      // Ensure we have exactly 5 locations
      while (selectedLocations.length < 5 && availableLocations.length > selectedLocations.length) {
        const remaining = availableLocations.filter(
          loc => !selectedLocations.some((sel: typeof loc) => sel.id === loc.id)
        );
        if (remaining.length > 0) {
          selectedLocations.push(remaining[Math.floor(Math.random() * remaining.length)]);
        }
      }

      // Get the food stop
      const selectedFoodStop = foodStops[questData.foodStopIndex - 1] ||
        foodStops[Math.floor(Math.random() * foodStops.length)];

      const quest: Quest = {
        id: `quest-${Date.now()}`,
        createdAt: new Date(),
        preferences: fullPreferences,
        categories: selectedCategories,
        locations: selectedLocations,
        foodStop: selectedFoodStop,
        aiProvider: isDGX ? 'dgx' : 'openai',
        progress: {
          currentIndex: 0,
          completed: new Array(selectedLocations.length).fill(false),
          photos: new Array(selectedLocations.length).fill(''),
        },
      };

      setQuest(quest);
      navigate('/itinerary');
    } catch (error) {
      console.error('Error generating quest:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const handleSurpriseMe = () => {
    // Clear existing selections
    selectedCategories.forEach(cat => toggleCategory(cat));
    
    // Randomly select 2-3 categories
    const shuffled = [...categories].sort(() => Math.random() - 0.5);
    const count = Math.random() > 0.5 ? 3 : 2;
    const selected = shuffled.slice(0, count);
    
    // Use timeout to create staggered selection effect
    selected.forEach(([key], index) => {
      setTimeout(() => toggleCategory(key), index * 150);
    });
  };

  const canProceed = selectedCategories.length >= 2;
  const maxReached = selectedCategories.length >= 3;

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col relative">
      {/* Mini confetti burst */}
      {showMinConfetti && <Confetti isActive={showMinConfetti} duration={1500} />}

      {/* Header */}
      <div className="page-padding">
        <button
          onClick={() => navigate('/onboarding')}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-6 hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          What excites you most about SF?
        </h1>
        <p className="text-muted-foreground">
          Pick 2-3 categories for your perfect quest
        </p>

        {/* Selection counter with animated dots */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                selectedCategories.length >= n
                  ? 'bg-primary dot-pop'
                  : 'bg-muted'
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            {selectedCategories.length}/3 selected
          </span>
          
          {/* Surprise Me button */}
          <button
            onClick={handleSurpriseMe}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium hover:bg-accent/30 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Surprise Me
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex-1 px-5 pb-32 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {categories.map(([key, info], index) => (
            <div
              key={key}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CategoryCard
                icon={info.icon}
                title={info.title}
                subtitle={info.subtitle}
                selected={selectedCategories.includes(key)}
                disabled={maxReached && !selectedCategories.includes(key)}
                onClick={() => toggleCategory(key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleGenerate}
            disabled={!canProceed || isGenerating}
            className={`relative w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all overflow-hidden ${
              canProceed && !isGenerating
                ? 'gradient-primary text-primary-foreground shadow-button btn-shimmer'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <div className="absolute inset-1 border-2 border-primary-foreground/20 border-b-primary-foreground rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
                </div>
                Crafting your adventure...
              </>
            ) : (
              <>
                <Sparkles className={`w-5 h-5 ${canProceed ? 'animate-pulse' : ''}`} />
                Generate My Quest
              </>
            )}
          </button>
          
          {!canProceed && (
            <p className="text-center text-muted-foreground text-sm mt-3 fade-in-up">
              Select at least 2 categories to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesScreen;
