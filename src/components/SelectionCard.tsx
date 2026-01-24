import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCardProps {
  label: string;
  sublabel?: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  label,
  sublabel,
  icon,
  selected,
  onClick,
  size = 'md',
}) => {
  const [isRippling, setIsRippling] = useState(false);
  const [justSelected, setJustSelected] = useState(false);

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  useEffect(() => {
    if (selected) {
      setJustSelected(true);
      const timer = setTimeout(() => setJustSelected(false), 300);
      return () => clearTimeout(timer);
    }
  }, [selected]);

  const handleClick = () => {
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'card-quest relative w-full text-left transition-all duration-200',
        'active:scale-[0.98] focus:outline-none ripple-effect',
        sizeClasses[size],
        selected && 'card-quest-selected selection-glow',
        justSelected && 'bounce-select',
        isRippling && 'rippling'
      )}
    >
      {/* Selection indicator with animation */}
      <div
        className={cn(
          'absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300',
          selected
            ? 'bg-primary scale-100 opacity-100'
            : 'bg-muted scale-75 opacity-0'
        )}
      >
        <Check className={cn(
          'w-3 h-3 text-primary-foreground transition-transform duration-200',
          selected ? 'scale-100' : 'scale-0'
        )} />
      </div>
      
      <div className="flex items-center gap-3">
        {icon && (
          <span className={cn(
            'text-2xl transition-transform duration-200',
            selected && 'scale-110'
          )}>
            {icon}
          </span>
        )}
        <div>
          <p className="font-medium text-foreground">{label}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
          )}
        </div>
      </div>
    </button>
  );
};

export default SelectionCard;
