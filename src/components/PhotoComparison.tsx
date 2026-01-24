import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

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
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  }, [updateSliderPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateSliderPosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      updateSliderPosition(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updateSliderPosition]);

  return (
    <div 
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden aspect-[4/3] cursor-ew-resize select-none touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Historic photo (bottom layer - fully visible) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${historicPhoto})` }}
      />
      
      {/* Current photo (top layer - clipped by slider) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${currentPhoto})`,
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      />
      
      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Vertical line */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg -translate-x-1/2" />
        
        {/* Handle circle */}
        <div 
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform ${
            isDragging ? 'scale-110' : 'scale-100'
          }`}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
      
      {/* Year labels */}
      <div 
        className={`absolute top-4 left-4 px-3 py-1.5 rounded-full bg-foreground/80 text-background text-sm font-medium backdrop-blur-sm transition-opacity duration-200 ${
          sliderPosition > 15 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Today
      </div>
      
      <div 
        className={`absolute top-4 right-4 px-3 py-1.5 rounded-full bg-foreground/80 text-background text-sm font-medium backdrop-blur-sm transition-opacity duration-200 ${
          sliderPosition < 85 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Circa {historicYear}
      </div>

      {/* Drag hint (only shows initially) */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground/60 text-background text-sm font-medium backdrop-blur-sm pointer-events-none transition-opacity duration-500 ${
        sliderPosition === 50 && !isDragging ? 'opacity-100 animate-pulse' : 'opacity-0'
      }`}>
        ← Drag to compare →
      </div>
    </div>
  );
};

export default PhotoComparison;
