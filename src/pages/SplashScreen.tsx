import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GoldenGateLogo from '@/components/GoldenGateLogo';
import { useQuestStore } from '@/store/questStore';

const taglines = [
  "Discover hidden gems",
  "Capture iconic moments",
  "Learn local stories",
];

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { hasSeenSplash, setHasSeenSplash, hasCompletedOnboarding, _hasHydrated } = useQuestStore();
  const [fadeOut, setFadeOut] = useState(false);
  const [currentTagline, setCurrentTagline] = useState(0);

  // Generate particles once
  const particles = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 4 + 6,
      delay: Math.random() * 5,
    })), []
  );

  useEffect(() => {
    // Wait for hydration before making navigation decisions
    if (!_hasHydrated) return;

    // If already seen splash, redirect
    if (hasSeenSplash) {
      if (hasCompletedOnboarding) {
        navigate('/itinerary');
      } else {
        navigate('/welcome');
      }
      return;
    }

    // Cycle through taglines
    const taglineInterval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 2000);

    return () => clearInterval(taglineInterval);
  }, [hasSeenSplash, hasCompletedOnboarding, navigate, _hasHydrated]);

  const handleContinue = () => {
    if (!_hasHydrated) return;
    
    setFadeOut(true);
    setTimeout(() => {
      setHasSeenSplash(true);
      navigate('/welcome');
    }, 300);
  };

  // Show loading state while hydrating
  if (!_hasHydrated) {
    return (
      <div className="mobile-container min-h-screen flex flex-col gradient-secondary items-center justify-center">
        <GoldenGateLogo size={120} />
        <h1 className="text-4xl font-extrabold text-primary-foreground mt-4">
          SF Quest
        </h1>
        <div className="mt-6 w-8 h-8 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`mobile-container min-h-screen flex flex-col gradient-secondary relative overflow-hidden transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle absolute rounded-full bg-accent/40"
            style={{
              left: `${particle.left}%`,
              bottom: '-10px',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              '--duration': `${particle.duration}s`,
              '--delay': `${particle.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

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

        {/* Animated cycling taglines */}
        <div className="mt-6 h-8 relative">
          {taglines.map((tagline, index) => (
            <p
              key={tagline}
              className={`absolute inset-0 text-center text-primary-foreground/70 font-medium transition-all duration-500 ${
                index === currentTagline
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2'
              }`}
            >
              ✨ {tagline}
            </p>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-8 pb-12 z-10 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <button
          onClick={handleContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-button btn-shimmer pulse-glow"
        >
          Start Your Quest
        </button>
        <p className="text-center text-primary-foreground/60 text-sm mt-4">
          Tap anywhere to continue
        </p>
      </div>

      {/* Tap anywhere handler */}
      <div 
        className="absolute inset-0 z-0" 
        onClick={handleContinue}
      />
    </div>
  );
};

export default SplashScreen;
