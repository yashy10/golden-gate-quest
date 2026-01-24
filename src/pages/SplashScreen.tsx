import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoldenGateLogo from '@/components/GoldenGateLogo';
import { useQuestStore } from '@/store/questStore';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { hasSeenSplash, setHasSeenSplash, hasCompletedOnboarding } = useQuestStore();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // If already seen splash, redirect
    if (hasSeenSplash) {
      if (hasCompletedOnboarding) {
        navigate('/itinerary');
      } else {
        navigate('/onboarding');
      }
      return;
    }

    // Auto-advance after 3 seconds
    const timer = setTimeout(() => {
      handleContinue();
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasSeenSplash, hasCompletedOnboarding, navigate]);

  const handleContinue = () => {
    setFadeOut(true);
    setTimeout(() => {
      setHasSeenSplash(true);
      navigate('/onboarding');
    }, 300);
  };

  return (
    <div
      className={`mobile-container min-h-screen flex flex-col gradient-secondary relative overflow-hidden transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleContinue}
    >
      {/* Fog layers */}
      <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden">
        <div className="fog-animation absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="fog-animation-delayed absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 z-10">
        {/* Logo */}
        <div className="animate-scale-in">
          <GoldenGateLogo size={160} />
        </div>

        {/* Brand name */}
        <h1 className="text-5xl font-extrabold text-primary-foreground mt-6 animate-fade-in">
          SF Quest
        </h1>

        {/* Tagline */}
        <p
          className="text-lg text-primary-foreground/80 mt-3 text-center animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          Discover San Francisco,
          <br />
          One Photo at a Time
        </p>
      </div>

      {/* CTA */}
      <div className="px-8 pb-12 z-10 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <button className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-button">
          Start Your Quest
        </button>
        <p className="text-center text-primary-foreground/60 text-sm mt-4">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
