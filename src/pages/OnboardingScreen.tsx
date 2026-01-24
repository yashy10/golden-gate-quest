import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import StepIndicator from '@/components/StepIndicator';
import SelectionCard from '@/components/SelectionCard';

const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    onboardingStep,
    setOnboardingStep,
    preferences,
    updatePreferences,
  } = useQuestStore();

  const handleNext = () => {
    if (onboardingStep < 4) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      navigate('/categories');
    }
  };

  const handleBack = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1);
    } else {
      navigate('/');
    }
  };

  const canProceed = () => {
    switch (onboardingStep) {
      case 1:
        return !!preferences.ageRange;
      case 2:
        return !!preferences.budget;
      case 3:
        return !!preferences.startingPoint;
      case 4:
        return !!preferences.timeAvailable && !!preferences.mobility && !!preferences.groupSize;
      default:
        return false;
    }
  };

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="page-padding flex items-center justify-between">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <StepIndicator currentStep={onboardingStep} totalSteps={4} />
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 overflow-y-auto pb-32">
        {onboardingStep === 1 && (
          <div className="fade-in-up">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              About You
            </h1>
            <p className="text-muted-foreground mb-6">
              Help us personalize your adventure
            </p>

            <p className="text-sm font-medium text-foreground mb-3">
              What's your age range?
            </p>
            <div className="space-y-3 stagger-children">
              {[
                { value: 'under-18', label: 'Under 18', icon: '🧒' },
                { value: '18-30', label: '18 - 30', icon: '🎓' },
                { value: '31-50', label: '31 - 50', icon: '💼' },
                { value: '51-65', label: '51 - 65', icon: '🌟' },
                { value: '65+', label: '65+', icon: '🌅' },
              ].map((option) => (
                <SelectionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  selected={preferences.ageRange === option.value}
                  onClick={() => updatePreferences({ ageRange: option.value })}
                />
              ))}
            </div>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="fade-in-up">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Your Budget
            </h1>
            <p className="text-muted-foreground mb-6">
              We'll tailor recommendations accordingly
            </p>

            <div className="space-y-3 stagger-children">
              {[
                { value: 'free', label: 'Free Only', sublabel: 'Parks, street art, views', icon: '🆓' },
                { value: 'budget', label: 'Budget ($)', sublabel: 'Under $20/day', icon: '💵' },
                { value: 'moderate', label: 'Moderate ($$)', sublabel: '$20-50/day', icon: '💳' },
                { value: 'flexible', label: 'Flexible ($$$)', sublabel: 'No limits', icon: '💎' },
              ].map((option) => (
                <SelectionCard
                  key={option.value}
                  label={option.label}
                  sublabel={option.sublabel}
                  icon={option.icon}
                  selected={preferences.budget === option.value}
                  onClick={() => updatePreferences({ budget: option.value })}
                />
              ))}
            </div>
          </div>
        )}

        {onboardingStep === 3 && (
          <div className="fade-in-up">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Starting Point
            </h1>
            <p className="text-muted-foreground mb-6">
              Where should we begin your quest?
            </p>

            <div className="space-y-3 stagger-children">
              <SelectionCard
                label="Use Current Location"
                sublabel="We'll start from where you are"
                icon="📍"
                selected={preferences.startingPoint?.type === 'current'}
                onClick={() =>
                  updatePreferences({
                    startingPoint: { type: 'current' },
                  })
                }
              />
              
              <div className="relative">
                <SelectionCard
                  label="Enter Address"
                  sublabel="Hotel, airport, or specific location"
                  icon="🏨"
                  selected={preferences.startingPoint?.type === 'address'}
                  onClick={() =>
                    updatePreferences({
                      startingPoint: { type: 'address', value: '' },
                    })
                  }
                />
                
                {preferences.startingPoint?.type === 'address' && (
                  <div className="mt-3 pl-12">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Enter your starting address..."
                        value={preferences.startingPoint?.value || ''}
                        onChange={(e) =>
                          updatePreferences({
                            startingPoint: { type: 'address', value: e.target.value },
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {onboardingStep === 4 && (
          <div className="fade-in-up">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Trip Details
            </h1>
            <p className="text-muted-foreground mb-6">
              Final touches to customize your experience
            </p>

            <p className="text-sm font-medium text-foreground mb-3">
              Time Available
            </p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { value: '2-3-hours', label: '2-3 hrs' },
                { value: 'half-day', label: 'Half Day' },
                { value: 'full-day', label: 'Full Day' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updatePreferences({ timeAvailable: option.value })}
                  className={`py-3 rounded-xl font-medium text-sm transition-all ${
                    preferences.timeAvailable === option.value
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="text-sm font-medium text-foreground mb-3">
              Mobility
            </p>
            <div className="space-y-2 mb-6">
              {[
                { value: 'anywhere', label: 'I can walk anywhere!', icon: '🚶' },
                { value: 'flat', label: 'Prefer flat routes', icon: '🛤️' },
                { value: 'accessible', label: 'Need accessible paths', icon: '♿' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updatePreferences({ mobility: option.value })}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-sm text-left transition-all flex items-center gap-3 ${
                    preferences.mobility === option.value
                      ? 'bg-primary/10 text-primary ring-2 ring-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>

            <p className="text-sm font-medium text-foreground mb-3">
              Group Size
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'solo', label: 'Solo', icon: '🧍' },
                { value: 'couple', label: 'Couple', icon: '👫' },
                { value: 'small', label: 'Small Group', icon: '👥' },
                { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updatePreferences({ groupSize: option.value })}
                  className={`py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    preferences.groupSize === option.value
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              canProceed()
                ? 'gradient-primary text-primary-foreground shadow-button'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {onboardingStep === 4 ? 'Choose Categories' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
