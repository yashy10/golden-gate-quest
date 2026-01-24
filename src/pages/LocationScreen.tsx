import React, { useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Navigation, Camera, Lightbulb } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';

const LocationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { index } = useParams<{ index: string }>();
  const locationIndex = parseInt(index || '0', 10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { _hasHydrated, currentQuest, completeLocation } = useQuestStore();

  if (!_hasHydrated) {
    return (
      <div className="mobile-container min-h-screen flex flex-col gradient-secondary items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentQuest) return <Navigate to="/" replace />;

  const location = currentQuest.locations[locationIndex];
  const isCompleted = currentQuest.progress.completed[locationIndex];

  if (!location) return <Navigate to="/itinerary" replace />;

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handleTakePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Complete the location with captured photo
      const photoUrl = URL.createObjectURL(file);
      completeLocation(locationIndex, photoUrl);
      navigate(`/discovery/${locationIndex}`);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  if (isCompleted) return <Navigate to={`/discovery/${locationIndex}`} replace />;

  return (
    <div className="mobile-container min-h-screen bg-background">
      {/* Hidden file input for native camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

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
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleNavigate}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold"
              >
                <Navigation className="w-5 h-5" />
                Navigate Here
              </button>
              <button
                onClick={handleTakePhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-button"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
            </div>
            <button
              onClick={() => {
                completeLocation(locationIndex, location.heroImage);
                navigate(`/discovery/${locationIndex}`);
              }}
              className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground font-medium text-sm"
            >
              Skip (Testing Only)
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
