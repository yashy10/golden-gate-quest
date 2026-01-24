import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Route, Clock, Camera, Layers, Share2, Download, RotateCcw } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import Confetti from '@/components/Confetti';
import GoldenGateLogo from '@/components/GoldenGateLogo';

const AchievementScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentQuest, resetQuest, getProgress } = useQuestStore();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!currentQuest) {
    navigate('/');
    return null;
  }

  const { total } = getProgress();
  const startTime = currentQuest.progress.startTime || currentQuest.createdAt;
  const duration = Math.round((Date.now() - new Date(startTime).getTime()) / 1000 / 60);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'SF Quest Achievement',
        text: `I just completed an SF Quest! Discovered ${total} amazing locations in San Francisco. 🎉`,
        url: window.location.origin,
      });
    }
  };

  const handleNewQuest = () => {
    resetQuest();
    navigate('/');
  };

  return (
    <div className="mobile-container min-h-screen bg-background">
      <Confetti isActive={showConfetti} duration={5000} />

      {/* Hero Section */}
      <div className="gradient-discovery pt-16 pb-8 px-5 text-center">
        <div className="animate-bounce-subtle">
          <div className="w-32 h-32 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm">
            <GoldenGateLogo size={100} />
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold text-white mb-2 fade-in-up">
          🎉 Quest Complete!
        </h1>
        <p className="text-white/80 fade-in-up" style={{ animationDelay: '0.1s' }}>
          You've unlocked: <span className="font-semibold">SF Explorer</span>
        </p>
        
        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm fade-in-up" style={{ animationDelay: '0.2s' }}>
          <span className="text-sm text-white/80">Completed on</span>
          <span className="text-sm font-medium text-white">
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-5 -mt-4">
        <div className="card-quest p-5 fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground">Locations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Route className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">3.2</p>
                <p className="text-xs text-muted-foreground">Miles Walked</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{timeString}</p>
                <p className="text-xs text-muted-foreground">Total Time</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground">Photos</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {currentQuest.categories.length} Categories
              </p>
              <p className="text-xs text-muted-foreground">Explored</p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Recap */}
      <div className="px-5 mt-6 fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Your Journey
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {currentQuest.locations.map((location, idx) => (
            <button
              key={location.id}
              onClick={() => navigate(`/discovery/${idx}`)}
              className="flex-shrink-0 w-20 h-20 rounded-xl bg-cover bg-center relative overflow-hidden"
              style={{ backgroundImage: `url(${currentQuest.progress.photos[idx] || location.heroImage})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-1 left-1 text-[10px] text-white font-medium">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Share Section */}
      <div className="px-5 mt-6 fade-in-up" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Share Your Adventure
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShare}
            className="card-quest p-4 flex items-center justify-center gap-2 text-foreground font-medium"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
          <button className="card-quest p-4 flex items-center justify-center gap-2 text-foreground font-medium">
            <Download className="w-5 h-5" />
            Save Image
          </button>
        </div>
      </div>

      {/* New Quest Button */}
      <div className="p-5 pb-8 mt-4 safe-bottom">
        <button
          onClick={handleNewQuest}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 shadow-button"
        >
          <RotateCcw className="w-5 h-5" />
          Start New Quest
        </button>
      </div>
    </div>
  );
};

export default AchievementScreen;
