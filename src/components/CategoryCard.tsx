import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  icon: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  icon,
  title,
  subtitle,
  selected,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'card-quest relative p-4 text-left w-full transition-all duration-200',
        'active:scale-[0.98] focus:outline-none',
        selected && 'card-quest-selected',
        disabled && !selected && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      
      {/* Icon */}
      <div className="text-3xl mb-3">{icon}</div>
      
      {/* Content */}
      <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
};

export default CategoryCard;
