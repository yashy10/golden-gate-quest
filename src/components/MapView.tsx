import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, ChevronRight, Check, Lock, ExternalLink, MapPin } from 'lucide-react';
import { Quest, categoryInfo } from '@/data/locations';

interface MapViewProps {
  quest: Quest;
  getLocationStatus: (index: number) => {
    isCompleted: boolean;
    isUnlocked: boolean;
    isCurrent: boolean;
  };
}

const MapView: React.FC<MapViewProps> = ({ quest, getLocationStatus }) => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  // Calculate bounds for static map
  const positions = quest.locations.map(loc => ({
    lat: loc.coordinates.lat,
    lng: loc.coordinates.lng
  }));
  
  const center = {
    lat: positions.reduce((sum, pos) => sum + pos.lat, 0) / positions.length,
    lng: positions.reduce((sum, pos) => sum + pos.lng, 0) / positions.length,
  };

  // Create markers string for static map URL
  const markersString = quest.locations.map((loc, index) => {
    const { isCompleted, isCurrent } = getLocationStatus(index);
    const color = isCompleted ? 'green' : isCurrent ? 'red' : 'gray';
    return `markers=color:${color}%7Clabel:${index + 1}%7C${loc.coordinates.lat},${loc.coordinates.lng}`;
  }).join('&');

  // Add food stop marker
  const foodMarker = `markers=color:orange%7Clabel:F%7C${quest.foodStop.coordinates.lat},${quest.foodStop.coordinates.lng}`;

  // Create path for route
  const pathString = quest.locations.map(loc => 
    `${loc.coordinates.lat},${loc.coordinates.lng}`
  ).join('|');

  const handleNavigate = (location: typeof quest.locations[0]) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const openFullMap = () => {
    // Open Google Maps with all waypoints
    const waypoints = quest.locations.slice(1, -1).map(loc => 
      `${loc.coordinates.lat},${loc.coordinates.lng}`
    ).join('|');
    
    const origin = quest.locations[0];
    const destination = quest.locations[quest.locations.length - 1];
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.coordinates.lat},${origin.coordinates.lng}&destination=${destination.coordinates.lat},${destination.coordinates.lng}&waypoints=${waypoints}&travelmode=walking`;
    window.open(url, '_blank');
  };

  const selectedLoc = selectedLocation !== null ? quest.locations[selectedLocation] : null;
  const selectedStatus = selectedLocation !== null ? getLocationStatus(selectedLocation) : null;

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
      {/* Map visualization */}
      <div className="h-full bg-muted/50 flex flex-col">
        {/* Interactive location list as map alternative */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative">
            {/* Route line */}
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-muted to-muted" />
            
            {/* Location markers */}
            <div className="space-y-4 relative">
              {quest.locations.map((location, index) => {
                const { isCompleted, isCurrent, isUnlocked } = getLocationStatus(index);
                
                return (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(index)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                      selectedLocation === index 
                        ? 'bg-primary/10 ring-2 ring-primary' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    {/* Marker */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 z-10 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-primary text-primary-foreground animate-pulse'
                          : isUnlocked
                          ? 'bg-white border-2 border-muted-foreground text-muted-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : isUnlocked ? (
                        index + 1
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    
                    {/* Location info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{categoryInfo[location.category].icon}</span>
                        <span className="text-xs text-muted-foreground">
                          {categoryInfo[location.category].title}
                        </span>
                      </div>
                      <p className={`font-medium truncate ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {isUnlocked ? location.name : '???'}
                      </p>
                      <p className="text-xs text-muted-foreground">{location.neighborhood}</p>
                    </div>

                    {/* Status badge */}
                    {isCompleted && (
                      <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded-full">
                        Done
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Food stop */}
              <button
                onClick={() => setSelectedLocation(-1)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                  selectedLocation === -1 
                    ? 'bg-accent/20 ring-2 ring-accent' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className="w-10 h-10 rounded-full gradient-golden flex items-center justify-center flex-shrink-0 z-10">
                  <span className="text-lg">🍽️</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{quest.foodStop.name}</p>
                  <p className="text-xs text-muted-foreground">{quest.foodStop.cuisine} • {quest.foodStop.priceRange}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Open in Maps button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={openFullMap}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium"
          >
            <MapPin className="w-4 h-4" />
            Open Full Route in Google Maps
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected location preview card */}
      {selectedLoc && selectedStatus && (
        <div 
          className="absolute bottom-20 left-4 right-4 card-quest p-4 z-10 fade-in-up"
        >
          <button 
            onClick={() => setSelectedLocation(null)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80"
          >
            ×
          </button>
          
          <div className="flex gap-3">
            <div
              className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0"
              style={{ 
                backgroundImage: `url(${selectedLoc.heroImage})`,
                filter: selectedStatus.isUnlocked ? 'none' : 'blur(4px)',
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {selectedStatus.isUnlocked ? selectedLoc.name : '???'}
              </h3>
              <p className="text-xs text-muted-foreground">{selectedLoc.neighborhood}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedLoc.address}</p>
            </div>
          </div>
          
          {selectedStatus.isUnlocked && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleNavigate(selectedLoc)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
              >
                <Navigation className="w-4 h-4" />
                Navigate
              </button>
              <button
                onClick={() => navigate(`/location/${selectedLocation}`)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                {selectedStatus.isCompleted ? 'View' : "I'm Here!"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Food stop preview */}
      {selectedLocation === -1 && (
        <div className="absolute bottom-20 left-4 right-4 card-quest p-4 z-10 fade-in-up">
          <button 
            onClick={() => setSelectedLocation(null)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80"
          >
            ×
          </button>
          
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-xl gradient-golden flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🍽️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{quest.foodStop.name}</h3>
              <p className="text-xs text-muted-foreground">{quest.foodStop.cuisine} • {quest.foodStop.priceRange}</p>
              <p className="text-xs text-muted-foreground mt-1">{quest.foodStop.neighborhood}</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${quest.foodStop.coordinates.lat},${quest.foodStop.coordinates.lng}`;
              window.open(url, '_blank');
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium"
          >
            <Navigation className="w-4 h-4" />
            Navigate to Food Stop
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;
