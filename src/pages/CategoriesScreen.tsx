import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import CategoryCard from '@/components/CategoryCard';
import { categoryInfo, Category } from '@/data/locations';

const CategoriesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCategories, toggleCategory, startQuest } = useQuestStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = Object.entries(categoryInfo) as [Category, typeof categoryInfo[Category]][];

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    startQuest();
    navigate('/itinerary');
  };

  const canProceed = selectedCategories.length >= 2;
  const maxReached = selectedCategories.length >= 3;

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="page-padding">
        <button
          onClick={() => navigate('/onboarding')}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-6"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          What excites you most about SF?
        </h1>
        <p className="text-muted-foreground">
          Pick 2-3 categories for your perfect quest
        </p>

        {/* Selection counter */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`w-3 h-3 rounded-full transition-all ${
                selectedCategories.length >= n
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            {selectedCategories.length}/3 selected
          </span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex-1 px-5 pb-32 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {categories.map(([key, info]) => (
            <CategoryCard
              key={key}
              icon={info.icon}
              title={info.title}
              subtitle={info.subtitle}
              selected={selectedCategories.includes(key)}
              disabled={maxReached && !selectedCategories.includes(key)}
              onClick={() => toggleCategory(key)}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleGenerate}
            disabled={!canProceed || isGenerating}
            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              canProceed && !isGenerating
                ? 'gradient-primary text-primary-foreground shadow-button'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Crafting your adventure...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate My Quest
              </>
            )}
          </button>
          
          {!canProceed && (
            <p className="text-center text-muted-foreground text-sm mt-3">
              Select at least 2 categories to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesScreen;
