import React from 'react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  className = '',
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i + 1 === currentStep
              ? 'w-8 bg-primary'
              : i + 1 < currentStep
              ? 'w-4 bg-primary/60'
              : 'w-4 bg-muted'
          )}
        />
      ))}
    </div>
  );
};

export default StepIndicator;
