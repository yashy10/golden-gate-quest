import React from 'react';
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
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'card-quest relative w-full text-left transition-all duration-200',
        'active:scale-[0.98] focus:outline-none',
        sizeClasses[size],
        selected && 'card-quest-selected'
      )}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
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
