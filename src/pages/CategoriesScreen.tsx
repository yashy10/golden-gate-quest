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

      // Call the AI edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            categories: selectedCategories,
            preferences: fullPreferences,
            allLocations,
            foodStops,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast({
            title: "Too many requests",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
        } else if (response.status === 402) {
          toast({
            title: "Credits depleted",
            description: "AI credits need to be topped up.",
            variant: "destructive",
          });
        } else {
          throw new Error(errorData.error || 'Failed to generate quest');
        }
        setIsGenerating(false);
        return;
      }

      const questData = await response.json();
      
      // Convert createdAt string back to Date
      const quest: Quest = {
        ...questData,
        createdAt: new Date(questData.createdAt),
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
