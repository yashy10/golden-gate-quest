import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Navigation, ChevronRight, Check, Lock, Utensils } from 'lucide-react';
import { Quest, categoryInfo } from '@/data/locations';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  quest: Quest;
  getLocationStatus: (index: number) => {
    isCompleted: boolean;
    isUnlocked: boolean;
    isCurrent: boolean;
  };
}

// Custom marker icons
const createMarkerIcon = (type: 'completed' | 'current' | 'upcoming' | 'locked', number: number) => {
  const colors = {
    completed: { bg: '#22c55e', border: '#16a34a', text: '#fff' },
    current: { bg: '#E24A4A', border: '#c53030', text: '#fff' },
    upcoming: { bg: '#fff', border: '#9ca3af', text: '#6b7280' },
    locked: { bg: '#e5e7eb', border: '#9ca3af', text: '#9ca3af' },
  };

  const color = colors[type];
  const pulseClass = type === 'current' ? 'animation: pulse 2s infinite;' : '';
  
  const iconContent = type === 'completed' 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color.text}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : type === 'locked'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color.text}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
    : `<span style="font-weight: 700; font-size: 14px;">${number}</span>`;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color.bg};
        border: 3px solid ${color.border};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color.text};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ${pulseClass}
      ">
        ${iconContent}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

const createFoodMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #F7B733, #e5a52f);
        border: 3px solid #d49a2a;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1a1a2e;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
        <span style="font-size: 16px;">🍽️</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Component to fit map to bounds
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  
  return null;
};

const MapView: React.FC<MapViewProps> = ({ quest, getLocationStatus }) => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  // Get all positions for bounds
  const positions: [number, number][] = quest.locations.map(loc => [
    loc.coordinates.lat,
    loc.coordinates.lng
  ]);

  // Calculate center
  const center: [number, number] = [
    positions.reduce((sum, pos) => sum + pos[0], 0) / positions.length,
    positions.reduce((sum, pos) => sum + pos[1], 0) / positions.length,
  ];

  // Create route segments with different colors
  const completedPositions: [number, number][] = [];
  const upcomingPositions: [number, number][] = [];
  
  quest.locations.forEach((loc, index) => {
    const pos: [number, number] = [loc.coordinates.lat, loc.coordinates.lng];
    const { isCompleted } = getLocationStatus(index);
    
    if (isCompleted) {
      completedPositions.push(pos);
      if (upcomingPositions.length === 0 && index < quest.locations.length - 1) {
        // Add first upcoming position to connect the segments
        upcomingPositions.push(pos);
      }
    } else {
      upcomingPositions.push(pos);
    }
  });

  const handleNavigate = (location: typeof quest.locations[0]) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const selectedLoc = selectedLocation !== null ? quest.locations[selectedLocation] : null;
  const selectedStatus = selectedLocation !== null ? getLocationStatus(selectedLocation) : null;

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
      {/* Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
      
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds positions={positions} />
        
        {/* Completed route segment */}
        {completedPositions.length > 1 && (
          <Polyline
            positions={completedPositions}
            pathOptions={{
              color: '#22c55e',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}
        
        {/* Upcoming route segment */}
        {upcomingPositions.length > 1 && (
          <Polyline
            positions={upcomingPositions}
            pathOptions={{
              color: '#9ca3af',
              weight: 4,
              opacity: 0.6,
              dashArray: '10, 10',
            }}
          />
        )}
        
        {/* Location markers */}
        {quest.locations.map((location, index) => {
          const { isCompleted, isCurrent, isUnlocked } = getLocationStatus(index);
          const markerType = isCompleted ? 'completed' 
            : isCurrent ? 'current' 
            : isUnlocked ? 'upcoming' 
            : 'locked';
          
          return (
            <Marker
              key={location.id}
              position={[location.coordinates.lat, location.coordinates.lng]}
              icon={createMarkerIcon(markerType, index + 1)}
              eventHandlers={{
                click: () => setSelectedLocation(index),
              }}
            />
          );
        })}
        
        {/* Food stop marker */}
        <Marker
          position={[quest.foodStop.coordinates.lat, quest.foodStop.coordinates.lng]}
          icon={createFoodMarkerIcon()}
        >
          <Popup>
            <div className="text-center p-1">
              <p className="font-semibold text-sm">{quest.foodStop.name}</p>
              <p className="text-xs text-muted-foreground">{quest.foodStop.cuisine}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Selected location preview card */}
      {selectedLoc && selectedStatus && (
        <div 
          className="absolute bottom-4 left-4 right-4 card-quest p-4 animate-slide-up z-[1000]"
          style={{ animation: 'fade-in-up 0.3s ease-out' }}
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{categoryInfo[selectedLoc.category].icon}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryInfo[selectedLoc.category].title}
                </span>
                {selectedStatus.isCompleted && (
                  <span className="ml-auto text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-foreground truncate">
                {selectedStatus.isUnlocked ? selectedLoc.name : '???'}
              </h3>
              <p className="text-xs text-muted-foreground">{selectedLoc.neighborhood}</p>
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
          
          {!selectedStatus.isUnlocked && (
            <div className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm">
              <Lock className="w-4 h-4" />
              Complete previous locations to unlock
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 card-quest p-3 z-[1000]">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400" />
            <span>Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🍽️</span>
            <span>Food Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
