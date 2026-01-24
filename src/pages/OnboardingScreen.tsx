import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Users, Clock, DollarSign, Map } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import StepIndicator from '@/components/StepIndicator';
import SelectionCard from '@/components/SelectionCard';

// Step background patterns
const StepBackgrounds: React.FC<{ step: number }> = ({ step }) => {
  const patterns = {
    1: (
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <Users 
            key={i} 
            className="absolute text-foreground" 
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${20 + Math.floor(i / 4) * 40}%`,
              width: '60px',
              height: '60px',
              transform: `rotate(${i * 15}deg)`,
            }}
          />
        ))}
      </div>
    ),
    2: (
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <DollarSign 
            key={i} 
            className="absolute text-foreground" 
            style={{
              left: `${5 + (i % 4) * 28}%`,
              top: `${10 + Math.floor(i / 4) * 30}%`,
              width: '40px',
              height: '40px',
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>
    ),
    3: (
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-12">
          {[...Array(96)].map((_, i) => (
            <div 
              key={i} 
              className="border border-foreground/30"
            />
          ))}
        </div>
        <Map className="absolute top-1/3 left-1/2 -translate-x-1/2 w-40 h-40 text-foreground" />
      </div>
    ),
    4: (
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <Clock 
            key={i} 
            className="absolute text-foreground" 
            style={{
              left: `${15 + (i % 3) * 30}%`,
              top: `${25 + Math.floor(i / 3) * 35}%`,
              width: '50px',
              height: '50px',
            }}
          />
        ))}
      </div>
    ),
  };
  
  return patterns[step as keyof typeof patterns] || null;
};

const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    onboardingStep,
    setOnboardingStep,
    preferences,
    updatePreferences,
  } = useQuestStore();

  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [wasEnabled, setWasEnabled] = useState(false);
  const prevStepRef = useRef(onboardingStep);

  // Track if button just became enabled for bounce animation
  const canProceedNow = (() => {
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
  })();

  useEffect(() => {
    if (canProceedNow && !wasEnabled) {
      setWasEnabled(true);
    } else if (!canProceedNow) {
      setWasEnabled(false);
    }
  }, [canProceedNow, wasEnabled]);

  useEffect(() => {
    if (prevStepRef.current !== onboardingStep) {
      const direction = onboardingStep > prevStepRef.current ? 'left' : 'right';
      setSlideDirection(direction);
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection(null);
      }, 300);
      
      prevStepRef.current = onboardingStep;
      return () => clearTimeout(timer);
    }
  }, [onboardingStep]);

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
      navigate('/welcome');
    }
  };

  const getSlideClass = () => {
    if (!slideDirection) return 'fade-in-up';
    return slideDirection === 'left' ? 'slide-in-right' : 'slide-in-left';
  };

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col relative">
      {/* Background pattern */}
      <StepBackgrounds step={onboardingStep} />

      {/* Header */}
      <div className="page-padding flex items-center justify-between relative z-10">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <StepIndicator currentStep={onboardingStep} totalSteps={4} />
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 overflow-y-auto pb-32 relative z-10">
        <div key={onboardingStep} className={getSlideClass()}>
          {onboardingStep === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                About You
              </h1>
              <p className="text-muted-foreground mb-1">
                Help us personalize your adventure
              </p>
              <p className="text-sm text-muted-foreground/70 mb-6">
                This helps us pick the right pace and places
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
            <div>
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
            <div>
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
                    <div className="mt-3 pl-12 fade-in-up">
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 4 && (
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Trip Details
              </h1>
              <p className="text-muted-foreground mb-6">
                Final touches to customize your experience
              </p>

              <p className="text-sm font-medium text-foreground mb-3">
                Time Available
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6 stagger-children">
                {[
                  { value: '2-3-hours', label: '2-3 hrs', hint: '3 spots' },
                  { value: 'half-day', label: 'Half Day', hint: '5 spots' },
                  { value: 'full-day', label: 'Full Day', hint: '8 spots' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreferences({ timeAvailable: option.value })}
                    className={`py-3 px-2 rounded-xl font-medium text-sm transition-all ${
                      preferences.timeAvailable === option.value
                        ? 'gradient-primary text-primary-foreground scale-105 shadow-button'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span className="block">{option.label}</span>
                    <span className={`text-xs ${
                      preferences.timeAvailable === option.value
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground/70'
                    }`}>
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-sm font-medium text-foreground mb-3">
                Mobility
              </p>
              <div className="space-y-2 mb-6 stagger-children">
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
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span className={`text-xl transition-transform ${
                      preferences.mobility === option.value ? 'scale-110' : ''
                    }`}>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="text-sm font-medium text-foreground mb-3">
                Group Size
              </p>
              <div className="grid grid-cols-2 gap-2 stagger-children">
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
                        ? 'gradient-primary text-primary-foreground scale-105 shadow-button'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span className={`transition-transform ${
                      preferences.groupSize === option.value ? 'scale-110' : ''
                    }`}>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleNext}
            disabled={!canProceedNow}
            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              canProceedNow
                ? 'gradient-primary text-primary-foreground shadow-button btn-shimmer'
                : 'bg-muted text-muted-foreground'
            } ${canProceedNow && wasEnabled ? '' : canProceedNow ? 'bounce-enabled' : ''}`}
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
