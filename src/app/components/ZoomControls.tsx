'use client';

import React from 'react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  stepSize?: number;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  stepSize = 10
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-popover rounded-md p-2 shadow-md z-10">
      <button 
        onClick={onZoomOut} 
        className="w-8 h-8 flex items-center justify-center bg-secondary rounded-md hover:bg-secondary/80"
        aria-label="Zoom out"
      >
        -
      </button>
      <div className="min-w-[60px] text-center font-mono">
        {scale}%
      </div>
      <button 
        onClick={onZoomIn} 
        className="w-8 h-8 flex items-center justify-center bg-secondary rounded-md hover:bg-secondary/80"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
};

export default ZoomControls; 