import React, { useState } from 'react';

interface PhotoComparisonProps {
  currentPhoto: string;
  historicPhoto: string;
  historicYear: string;
}

const PhotoComparison: React.FC<PhotoComparisonProps> = ({
  currentPhoto,
  historicPhoto,
  historicYear,
}) => {
  const [showHistoric, setShowHistoric] = useState(false);

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
      {/* Current photo */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
          showHistoric ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundImage: `url(${currentPhoto})` }}
      />
      
      {/* Historic photo */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
          showHistoric ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${historicPhoto})` }}
      />
      
      {/* Year label */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-foreground/80 text-background text-sm font-medium backdrop-blur-sm">
        {showHistoric ? `Circa ${historicYear}` : 'Today'}
      </div>
      
      {/* Toggle buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-full bg-foreground/20 backdrop-blur-sm">
        <button
          onClick={() => setShowHistoric(false)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !showHistoric
              ? 'bg-card text-foreground shadow-sm'
              : 'text-background/80'
          }`}
        >
          Now
        </button>
        <button
          onClick={() => setShowHistoric(true)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            showHistoric
              ? 'bg-card text-foreground shadow-sm'
              : 'text-background/80'
          }`}
        >
          Then
        </button>
      </div>
    </div>
  );
};

export default PhotoComparison;
