import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import CategoryCard from '@/components/CategoryCard';
import { categoryInfo, Category } from '@/data/locations';
import Confetti from '@/components/Confetti';

const CategoriesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCategories, toggleCategory } = useQuestStore();
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

  const handleContinue = () => {
    navigate('/chat-itinerary');
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
          Discover SF's Cultural Soul
        </h1>
        <p className="text-muted-foreground">
          Explore arts, recreation & community identity — pick 2-3 themes
        </p>
        <p className="text-xs text-accent mt-2 font-medium">
          🌉 Celebrating what makes San Francisco unique
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
                culturalFocus={info.culturalFocus}
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
            onClick={handleContinue}
            disabled={!canProceed}
            className={`relative w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all overflow-hidden ${
              canProceed
                ? 'gradient-primary text-primary-foreground shadow-button btn-shimmer'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <ArrowRight className={`w-5 h-5 ${canProceed ? 'animate-pulse' : ''}`} />
            Continue
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
