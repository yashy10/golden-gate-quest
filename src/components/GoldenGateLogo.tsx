import React from 'react';

interface GoldenGateLogoProps {
  className?: string;
  size?: number;
}

const GoldenGateLogo: React.FC<GoldenGateLogoProps> = ({
  className = '',
  size = 120,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bridge towers forming Q shape */}
      <g>
        {/* Left tower */}
        <rect
          x="28"
          y="30"
          width="8"
          height="55"
          rx="2"
          fill="hsl(var(--primary))"
        />
        {/* Left tower top */}
        <rect
          x="25"
          y="25"
          width="14"
          height="8"
          rx="2"
          fill="hsl(var(--primary))"
        />
        
        {/* Right tower */}
        <rect
          x="84"
          y="30"
          width="8"
          height="55"
          rx="2"
          fill="hsl(var(--primary))"
        />
        {/* Right tower top */}
        <rect
          x="81"
          y="25"
          width="14"
          height="8"
          rx="2"
          fill="hsl(var(--primary))"
        />
        
        {/* Top cable */}
        <path
          d="M32 28 Q60 50 88 28"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Road deck */}
        <rect
          x="25"
          y="78"
          width="70"
          height="6"
          rx="2"
          fill="hsl(var(--primary))"
        />
        
        {/* Vertical cables left */}
        <line x1="40" y1="35" x2="40" y2="78" stroke="hsl(var(--primary))" strokeWidth="2" />
        <line x1="50" y1="42" x2="50" y2="78" stroke="hsl(var(--primary))" strokeWidth="2" />
        
        {/* Vertical cables right */}
        <line x1="80" y1="35" x2="80" y2="78" stroke="hsl(var(--primary))" strokeWidth="2" />
        <line x1="70" y1="42" x2="70" y2="78" stroke="hsl(var(--primary))" strokeWidth="2" />
        
        {/* Q tail */}
        <path
          d="M70 84 L95 105"
          stroke="hsl(var(--accent))"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default GoldenGateLogo;
