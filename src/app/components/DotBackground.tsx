'use client';

import React from 'react';

interface DotBackgroundProps {
  scale: number;
  dotSize?: number;
  dotColor?: string;
  width?: number;
  height?: number;
}

export const DotBackground: React.FC<DotBackgroundProps> = ({
  scale,
  dotSize = 25,
  dotColor = 'rgba(100,100,100,0.3)',
  width = 6000,
  height = 6000
}) => {
  return (
    <div 
      className="absolute top-0 left-0"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: `${dotSize * scale / 100}px ${dotSize * scale / 100}px`,
        backgroundPosition: 'center center',
        transform: `translate(-50%, -50%)`,
        transformStyle: 'preserve-3d',
        pointerEvents: 'none',
        zIndex: -1,
        zoom: scale / 100,
        transformOrigin: 'center',
      }}
    />
  );
};

export default DotBackground; 