import React from 'react';
import { Lock, MapPin, Check, Navigation, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Location, categoryInfo } from '@/data/locations';

interface LocationCardProps {
  location: Location;
  index: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  walkingTime?: string;
  onNavigate?: () => void;
  onSelect?: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  index,
  isUnlocked,
  isCompleted,
  isCurrent,
  walkingTime,
  onNavigate,
  onSelect,
}) => {
  const categoryData = categoryInfo[location.category];
  
  return (
    <div
      className={cn(
        'card-quest p-4 transition-all duration-300',
        isCurrent && 'ring-2 ring-primary pulse-glow',
        !isUnlocked && 'opacity-80'
      )}
    >
      <div className="flex gap-4">
        {/* Index / Status badge */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
              isCompleted && 'bg-green-500 text-white',
              isCurrent && !isCompleted && 'gradient-primary text-white',
              !isUnlocked && 'bg-muted text-muted-foreground'
            )}
          >
            {isCompleted ? (
              <Check className="w-5 h-5" />
            ) : isUnlocked ? (
              index + 1
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </div>
          
          {/* Connector line (not on last item) */}
          <div className="w-0.5 flex-1 bg-border mt-2 min-h-[20px]" />
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-4">
          {isUnlocked ? (
            <>
              {/* Unlocked view */}
              <div className="flex gap-3">
                <div
                  className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${location.heroImage})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{categoryData.icon}</span>
                    <span className="text-xs text-muted-foreground">
                      {categoryData.title}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground truncate">
                    {location.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    {location.neighborhood}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              {isCurrent && !isCompleted && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={onNavigate}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate
                  </button>
                  <button
                    onClick={onSelect}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                  >
                    I'm Here!
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {isCompleted && (
                <button
                  onClick={onSelect}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium"
                >
                  View Discovery
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              {/* Locked view */}
              <div className="flex gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-md scale-110"
                    style={{ backgroundImage: `url(${location.heroImage})` }}
                  />
                  <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{categoryData.icon}</span>
                    <span className="text-xs text-muted-foreground">
                      {categoryData.title}
                    </span>
                  </div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                  {walkingTime && (
                    <p className="text-xs text-muted-foreground">
                      Walk: {walkingTime}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationCard;
