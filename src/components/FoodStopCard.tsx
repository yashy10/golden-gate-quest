import React from 'react';
import { Utensils, MapPin, Check } from 'lucide-react';
import { FoodStop } from '@/data/locations';

interface FoodStopCardProps {
  foodStop: FoodStop;
  isVisited: boolean;
  onVisit: () => void;
  onSkip: () => void;
}

const FoodStopCard: React.FC<FoodStopCardProps> = ({
  foodStop,
  isVisited,
  onVisit,
  onSkip,
}) => {
  return (
    <div className="card-quest p-4 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full gradient-golden flex items-center justify-center">
            {isVisited ? (
              <Check className="w-5 h-5 text-accent-foreground" />
            ) : (
              <Utensils className="w-5 h-5 text-accent-foreground" />
            )}
          </div>
          <div className="w-0.5 flex-1 bg-accent/30 mt-2 min-h-[20px]" />
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-4">
          <span className="text-xs font-medium text-accent">
            🍽️ Local Food Stop
          </span>
          
          <div className="flex gap-3 mt-2">
            <div
              className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${foodStop.image})` }}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{foodStop.name}</h3>
              <p className="text-xs text-muted-foreground">
                {foodStop.cuisine} • {foodStop.priceRange}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                {foodStop.neighborhood}
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1">Try:</p>
            <div className="flex flex-wrap gap-1">
              {foodStop.recommendations.map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          {!isVisited && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={onSkip}
                className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium"
              >
                Skip for Now
              </button>
              <button
                onClick={onVisit}
                className="flex-1 py-2 rounded-xl gradient-golden text-accent-foreground text-sm font-medium"
              >
                Visited!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodStopCard;
