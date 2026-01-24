import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Quest, UserPreferences, Category, generateQuest } from '@/data/locations';

interface QuestState {
  // Current quest
  currentQuest: Quest | null;
  
  // Onboarding state
  onboardingStep: number;
  preferences: Partial<UserPreferences>;
  selectedCategories: Category[];
  
  // UI state
  hasSeenSplash: boolean;
  hasCompletedOnboarding: boolean;
  _hasHydrated: boolean;
  
  // Actions
  setHasSeenSplash: (value: boolean) => void;
  setOnboardingStep: (step: number) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  toggleCategory: (category: Category) => void;
  
  // Quest actions
  startQuest: () => void;
  setQuest: (quest: Quest) => void;
  completeLocation: (index: number, photoUrl?: string) => void;
  visitFoodStop: () => void;
  resetQuest: () => void;
  
  // Computed
  getCurrentLocation: () => Quest['locations'][0] | null;
  getProgress: () => { completed: number; total: number; percentage: number };
  
  // Hydration
  setHasHydrated: (state: boolean) => void;
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      currentQuest: null,
      onboardingStep: 1,
      preferences: {},
      selectedCategories: [],
      hasSeenSplash: false,
      hasCompletedOnboarding: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      setHasSeenSplash: (value) => set({ hasSeenSplash: value }),
      
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      
      updatePreferences: (prefs) => 
        set((state) => ({ 
          preferences: { ...state.preferences, ...prefs } 
        })),
      
      toggleCategory: (category) => 
        set((state) => {
          const categories = state.selectedCategories.includes(category)
            ? state.selectedCategories.filter(c => c !== category)
            : state.selectedCategories.length < 3
              ? [...state.selectedCategories, category]
              : state.selectedCategories;
          return { selectedCategories: categories };
        }),
      
      startQuest: () => {
        const state = get();
        const fullPreferences: UserPreferences = {
          ageRange: state.preferences.ageRange || '18-30',
          budget: state.preferences.budget || 'moderate',
          startingPoint: state.preferences.startingPoint || { type: 'current' },
          timeAvailable: state.preferences.timeAvailable || 'half-day',
          mobility: state.preferences.mobility || 'anywhere',
          groupSize: state.preferences.groupSize || 'solo',
        };
        
        const quest = generateQuest(state.selectedCategories, fullPreferences);
        set({ 
          currentQuest: quest,
          hasCompletedOnboarding: true,
        });
      },
      
      setQuest: (quest: Quest) => {
        set({
          currentQuest: quest,
          hasCompletedOnboarding: true,
        });
      },
      
      completeLocation: (index, photoUrl) => 
        set((state) => {
          if (!state.currentQuest) return state;
          
          const newCompleted = [...state.currentQuest.progress.completed];
          const newPhotos = [...state.currentQuest.progress.photos];
          
          newCompleted[index] = true;
          if (photoUrl) newPhotos[index] = photoUrl;
          
          // Set start time if this is the first completion
          const startTime = state.currentQuest.progress.startTime || new Date();
          
          return {
            currentQuest: {
              ...state.currentQuest,
              progress: {
                ...state.currentQuest.progress,
                completed: newCompleted,
                photos: newPhotos,
                currentIndex: Math.min(index + 1, state.currentQuest.locations.length - 1),
                startTime,
              },
            },
          };
        }),
      
      visitFoodStop: () => 
        set((state) => {
          if (!state.currentQuest) return state;
          return {
            currentQuest: {
              ...state.currentQuest,
              // Mark food stop as visited (we can add a flag if needed)
            },
          };
        }),
      
      resetQuest: () => 
        set({
          currentQuest: null,
          onboardingStep: 1,
          preferences: {},
          selectedCategories: [],
          hasCompletedOnboarding: false,
        }),
      
      getCurrentLocation: () => {
        const state = get();
        if (!state.currentQuest) return null;
        return state.currentQuest.locations[state.currentQuest.progress.currentIndex];
      },
      
      getProgress: () => {
        const state = get();
        if (!state.currentQuest) return { completed: 0, total: 0, percentage: 0 };
        
        const completed = state.currentQuest.progress.completed.filter(Boolean).length;
        const total = state.currentQuest.locations.length;
        const percentage = Math.round((completed / total) * 100);
        
        return { completed, total, percentage };
      },
    }),
    {
      name: 'sf-quest-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
