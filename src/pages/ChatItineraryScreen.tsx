import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Check, MapPin, Utensils, Loader2, RefreshCw } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import { allLocations, foodStops, UserPreferences, Quest } from '@/data/locations';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ItineraryOption {
  theme: string;
  description: string;
  locationIndices: number[];
  foodStopIndex: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ChatItineraryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedCategories, preferences, setQuest, _hasHydrated } = useQuestStore();
  
  const [option1, setOption1] = useState<ItineraryOption | null>(null);
  const [option2, setOption2] = useState<ItineraryOption | null>(null);
  const [selectedOption, setSelectedOption] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter locations by selected categories
  const availableLocations = allLocations.filter(loc =>
    selectedCategories.includes(loc.category)
  );

  const fullPreferences: UserPreferences = {
    ageRange: preferences.ageRange || '18-30',
    budget: preferences.budget || 'moderate',
    startingPoint: preferences.startingPoint || { type: 'current' },
    timeAvailable: preferences.timeAvailable || 'half-day',
    mobility: preferences.mobility || 'anywhere',
    groupSize: preferences.groupSize || 'solo',
  };

  // Prepare data for API
  const apiLocations = availableLocations.map((loc, i) => ({
    index: i + 1,
    name: loc.name,
    neighborhood: loc.neighborhood,
    category: loc.category,
    shortSummary: loc.shortSummary,
  }));

  const apiFoodStops = foodStops.map((fs, i) => ({
    index: i + 1,
    name: fs.name,
    cuisine: fs.cuisine,
    priceRange: fs.priceRange,
    neighborhood: fs.neighborhood,
  }));

  // Generate initial itineraries
  useEffect(() => {
    if (!_hasHydrated) return;
    
    const generateItineraries = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-itinerary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'generate',
            categories: selectedCategories,
            preferences: {
              ageRange: fullPreferences.ageRange,
              budget: fullPreferences.budget,
              timeAvailable: fullPreferences.timeAvailable,
              mobility: fullPreferences.mobility,
              groupSize: fullPreferences.groupSize,
            },
            availableLocations: apiLocations,
            availableFoodStops: apiFoodStops,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to generate itineraries`);
        }

        const result = await response.json();
        console.log('Generated itineraries:', result);

        if (result.type === 'itineraries' && result.data) {
          setOption1(result.data.option1);
          setOption2(result.data.option2);
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "I've created two unique itinerary options for you! Take a look and let me know if you'd like any changes. You can ask me to swap locations, change the vibe, or regenerate completely new options."
          }]);
        }
      } catch (error) {
        console.error('Error generating itineraries:', error);
        toast({
          title: "Failed to generate itineraries",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateItineraries();
  }, [_hasHydrated]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          categories: selectedCategories,
          preferences: {
            ageRange: fullPreferences.ageRange,
            budget: fullPreferences.budget,
            timeAvailable: fullPreferences.timeAvailable,
            mobility: fullPreferences.mobility,
            groupSize: fullPreferences.groupSize,
          },
          availableLocations: apiLocations,
          availableFoodStops: apiFoodStops,
          currentItineraries: { option1, option2 },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to process message`);
      }

      const result = await response.json();
      console.log('Chat response:', result);

      // Update itineraries if provided
      if (result.type === 'update' && result.data) {
        if (result.data.option1) {
          setOption1(result.data.option1);
        }
        if (result.data.option2) {
          setOption2(result.data.option2);
        }
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.data?.chatResponse || "I've updated your itinerary!",
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRegenerateOptions = async () => {
    setIsLoading(true);
    setOption1(null);
    setOption2(null);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate',
          categories: selectedCategories,
          preferences: {
            ageRange: fullPreferences.ageRange,
            budget: fullPreferences.budget,
            timeAvailable: fullPreferences.timeAvailable,
            mobility: fullPreferences.mobility,
            groupSize: fullPreferences.groupSize,
          },
          availableLocations: apiLocations,
          availableFoodStops: apiFoodStops,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to regenerate`);
      }

      const result = await response.json();
      if (result.type === 'itineraries' && result.data) {
        setOption1(result.data.option1);
        setOption2(result.data.option2);
        
        setMessages(prev => [...prev, {
          id: `assistant-regen-${Date.now()}`,
          role: 'assistant',
          content: "I've generated two fresh itinerary options for you! Let me know what you think.",
        }]);
      }
    } catch (error) {
      console.error('Error regenerating:', error);
      toast({
        title: "Failed to regenerate",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateItinerary = () => {
    const selectedItinerary = selectedOption === 1 ? option1 : option2;
    if (!selectedItinerary) return;

    // Map indices to actual locations
    let selectedLocations = selectedItinerary.locationIndices
      .map(idx => availableLocations[idx - 1])
      .filter(Boolean)
      .slice(0, 5);

    // Ensure we have exactly 5 locations
    while (selectedLocations.length < 5 && availableLocations.length > selectedLocations.length) {
      const remaining = availableLocations.filter(
        loc => !selectedLocations.some(sel => sel.id === loc.id)
      );
      if (remaining.length > 0) {
        selectedLocations.push(remaining[Math.floor(Math.random() * remaining.length)]);
      }
    }

    const selectedFoodStop = foodStops[selectedItinerary.foodStopIndex - 1] ||
      foodStops[Math.floor(Math.random() * foodStops.length)];

    const quest: Quest = {
      id: `quest-${Date.now()}`,
      createdAt: new Date(),
      preferences: fullPreferences,
      categories: selectedCategories,
      locations: selectedLocations,
      foodStop: selectedFoodStop,
      aiProvider: 'openai',
      progress: {
        currentIndex: 0,
        completed: new Array(selectedLocations.length).fill(false),
        photos: new Array(selectedLocations.length).fill(''),
      },
    };

    setQuest(quest);
    navigate('/itinerary');
  };

  const renderItineraryOption = (option: ItineraryOption | null, optionNumber: 1 | 2) => {
    const isSelected = selectedOption === optionNumber;
    
    if (!option) {
      return (
        <div className="flex-1 min-w-0 bg-card border border-border rounded-xl p-4 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <button
        onClick={() => setSelectedOption(optionNumber)}
        className={cn(
          "flex-1 min-w-0 bg-card border-2 rounded-xl p-4 text-left transition-all",
          isSelected 
            ? "border-primary shadow-lg shadow-primary/20" 
            : "border-border hover:border-primary/50"
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Option {optionNumber}</span>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-foreground mt-1 line-clamp-1">{option.theme}</h3>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{option.description}</p>
        
        <div className="space-y-1.5">
          {option.locationIndices.slice(0, 5).map((idx, i) => {
            const location = availableLocations[idx - 1];
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-medium">{i + 1}</span>
                </div>
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="truncate text-foreground">{location?.name || `Location ${idx}`}</span>
              </div>
            );
          })}
          
          <div className="flex items-center gap-2 text-xs pt-1 border-t border-border mt-2">
            <Utensils className="w-3 h-3 text-accent ml-7" />
            <span className="truncate text-muted-foreground">
              {foodStops[option.foodStopIndex - 1]?.name || 'Food stop'}
            </span>
          </div>
        </div>
      </button>
    );
  };

  // Loading state
  if (!_hasHydrated) {
    return (
      <div className="mobile-container min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="page-padding pb-2">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/categories')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <button
            onClick={handleRegenerateOptions}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            New Options
          </button>
        </div>

        <h1 className="text-xl font-bold text-foreground mb-1">Choose Your Quest</h1>
        <p className="text-sm text-muted-foreground">Select an option or chat to customize</p>
      </div>

      {/* Itinerary Options */}
      <div className="px-5 mb-4">
        <div className="flex gap-3">
          {renderItineraryOption(option1, 1)}
          {renderItineraryOption(option2, 2)}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 px-5">
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input + Generate Button */}
      <div className="p-5 pt-2 bg-background border-t border-border safe-bottom">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to change anything..."
              disabled={isSending || isLoading}
              className="w-full bg-muted rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-50 disabled:bg-muted"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        <Button
          onClick={handleGenerateItinerary}
          disabled={isLoading || (!option1 && !option2)}
          className="w-full py-6 rounded-2xl font-semibold text-base gradient-primary shadow-button"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Itinerary
        </Button>
      </div>
    </div>
  );
};

export default ChatItineraryScreen;
