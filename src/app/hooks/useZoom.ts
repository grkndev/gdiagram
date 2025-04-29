import { useState } from 'react';

export interface UseZoomProps {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  stepSize?: number;
}

export const useZoom = ({
  initialScale = 100,
  minScale = 10,
  maxScale = 300,
  stepSize = 5
}: UseZoomProps = {}) => {
  const [scale, setScale] = useState(initialScale);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    setScale(prevScale => {
      const newScale = delta > 0 
        ? Math.max(minScale, prevScale - stepSize) 
        : Math.min(maxScale, prevScale + stepSize);
      return newScale;
    });
  };

  const adjustScale = (amount: number) => {
    setScale(prevScale => {
      const newScale = Math.max(minScale, Math.min(maxScale, prevScale + amount));
      return newScale;
    });
  };

  return {
    scale,
    setScale,
    handleWheel,
    adjustScale
  };
}; 