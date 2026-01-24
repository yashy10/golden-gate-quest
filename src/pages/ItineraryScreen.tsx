import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Route, Menu, Trophy, List, Map } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import LocationCard from '@/components/LocationCard';
import FoodStopCard from '@/components/FoodStopCard';
import ProgressRing from '@/components/ProgressRing';
import GoldenGateLogo from '@/components/GoldenGateLogo';
import MapView from '@/components/MapView';

const ItineraryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentQuest, getProgress, visitFoodStop } = useQuestStore();
  const [foodVisited, setFoodVisited] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  if (!currentQuest) {
    navigate('/');
    return null;
  }

  const { completed, total, percentage } = getProgress();
  const isQuestComplete = completed === total;

  // Determine which locations are unlocked
  const getLocationStatus = (index: number) => {
    const isCompleted = currentQuest.progress.completed[index];
    // First location is always unlocked, subsequent ones require previous completion
    const isUnlocked = index === 0 || currentQuest.progress.completed[index - 1];
    const isCurrent = currentQuest.progress.currentIndex === index && !isCompleted;
    
    return { isCompleted, isUnlocked, isCurrent };
  };

  const handleNavigate = (location: typeof currentQuest.locations[0]) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handleSelectLocation = (index: number) => {
    navigate(`/location/${index}`);
  };

  const walkingTimes = ['12 min', '15 min', '8 min', '20 min', '10 min'];

  // Insert food stop after position 2
  const foodStopPosition = 2;

  if (isQuestComplete) {
    navigate('/achievement');
    return null;
  }

  return (
    <div className="mobile-container min-h-screen bg-background">
      {/* Header */}
      <div className="page-padding pb-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GoldenGateLogo size={40} />
            <div>
              <h1 className="text-lg font-bold text-foreground">Your SF Quest</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Stats bar with view toggle */}
        <div className="card-quest p-4 mb-4">
          <div className="flex items-center gap-4">
            <ProgressRing progress={percentage} size={60} strokeWidth={5} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {completed}/{total} Discovered
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {total} Locations
                </span>
                <span className="flex items-center gap-1">
                  <Route className="w-3 h-3" />
                  ~3.2 miles
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~4 hrs
                </span>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'map'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Map view"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        /* Locations Timeline */
        <div className="px-5 pb-32 space-y-0">
          {currentQuest.locations.map((location, index) => {
            const { isCompleted, isUnlocked, isCurrent } = getLocationStatus(index);
            
            return (
              <React.Fragment key={location.id}>
                <LocationCard
                  location={location}
                  index={index}
                  isUnlocked={isUnlocked}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  walkingTime={index > 0 ? walkingTimes[index - 1] : undefined}
                  onNavigate={() => handleNavigate(location)}
                  onSelect={() => handleSelectLocation(index)}
                />
                
                {/* Insert food stop after position 2 */}
                {index === foodStopPosition && (
                  <FoodStopCard
                    foodStop={currentQuest.foodStop}
                    isVisited={foodVisited}
                    onVisit={() => {
                      setFoodVisited(true);
                      visitFoodStop();
                    }}
                    onSkip={() => setFoodVisited(true)}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Final destination marker */}
          <div className="flex items-center gap-4 pt-4">
            <div className="w-10 h-10 rounded-full gradient-golden flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Quest Complete!</p>
              <p className="text-xs text-muted-foreground">
                Finish all locations to unlock your achievement
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Map View */
        <div className="px-5 pb-5">
          <MapView quest={currentQuest} getLocationStatus={getLocationStatus} />
        </div>
      )}
    </div>
  );
};

export default ItineraryScreen;
