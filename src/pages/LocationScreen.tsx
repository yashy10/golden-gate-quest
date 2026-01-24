import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Navigation, Camera, Lightbulb, X } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';

const LocationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { index } = useParams<{ index: string }>();
  const locationIndex = parseInt(index || '0', 10);
  
  const { currentQuest, completeLocation } = useQuestStore();
  const [showCamera, setShowCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  if (!currentQuest) {
    navigate('/');
    return null;
  }

  const location = currentQuest.locations[locationIndex];
  const isCompleted = currentQuest.progress.completed[locationIndex];

  if (!location) {
    navigate('/itinerary');
    return null;
  }

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    setShowFlash(true);
    
    // Simulate camera capture
    await new Promise((resolve) => setTimeout(resolve, 300));
    setShowFlash(false);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Complete the location
    completeLocation(locationIndex, location.heroImage);
    
    // Navigate to discovery page
    navigate(`/discovery/${locationIndex}`);
  };

  if (isCompleted) {
    navigate(`/discovery/${locationIndex}`);
    return null;
  }

  return (
    <div className="mobile-container min-h-screen bg-background">
      {/* Camera overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Simulated camera view */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${location.heroImage})` }}
          />
          
          {/* Flash effect */}
          {showFlash && (
            <div className="shutter-flash absolute inset-0 bg-white" />
          )}
          
          {/* Camera UI */}
          <div className="absolute inset-0 flex flex-col">
            {/* Top bar */}
            <div className="p-5 flex items-center justify-between">
              <button
                onClick={() => setShowCamera(false)}
                className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="px-4 py-2 rounded-full bg-black/50">
                <p className="text-white text-sm font-medium">{location.name}</p>
              </div>
              
              <div className="w-10" />
            </div>
            
            {/* Frame guide */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full aspect-[4/3] border-2 border-white/50 rounded-2xl relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                
                <p className="absolute inset-0 flex items-center justify-center text-white/70 text-sm text-center px-8">
                  Align the landmark within the frame
                </p>
              </div>
            </div>
            
            {/* Capture button */}
            <div className="p-8 pb-12 flex justify-center safe-bottom">
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center"
              >
                <div className={`w-16 h-16 rounded-full gradient-primary ${
                  isCapturing ? 'animate-pulse' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative">
        <div
          className="h-72 bg-cover bg-center"
          style={{ backgroundImage: `url(${location.heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        
        <button
          onClick={() => navigate('/itinerary')}
          className="absolute top-5 left-5 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="card-quest p-5">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {location.name}
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            {location.neighborhood} • {location.address}
          </p>

          {/* Hint */}
          <div className="bg-accent/10 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Hint</span>
            </div>
            <p className="text-sm text-foreground">
              {location.hints[0]}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleNavigate}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold"
            >
              <Navigation className="w-5 h-5" />
              Navigate Here
            </button>
            <button
              onClick={() => setShowCamera(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-button"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
          </div>
        </div>

        {/* Story preview */}
        <div className="mt-4 card-quest p-5">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            What you'll discover
          </h2>
          <p className="text-muted-foreground text-sm">
            Capture this location to unlock its hidden history, vintage photos,
            and fascinating stories. You'll also be able to have a voice
            conversation to learn even more!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationScreen;
