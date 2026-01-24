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
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        
        return (
          <React.Fragment key={i}>
            {/* Connecting line */}
            {i > 0 && (
              <div
                className={cn(
                  'h-0.5 w-3 rounded-full transition-all duration-500',
                  isCompleted || isActive
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            )}
            
            {/* Dot */}
            <div
              className={cn(
                'rounded-full transition-all duration-300',
                isActive
                  ? 'w-3 h-3 bg-primary step-pulse'
                  : isCompleted
                  ? 'w-2.5 h-2.5 bg-primary'
                  : 'w-2 h-2 bg-muted'
              )}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
