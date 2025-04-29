'use client';

import React from 'react';
import { useDrag } from '../hooks/useDrag';
import { useZoom } from '../hooks/useZoom';
import { SceneProvider } from '../hooks/SceneContext';
import DotBackground from './DotBackground';
import ZoomControls from './ZoomControls';

interface SceneProps {
  children?: React.ReactNode;
}

export const Scene: React.FC<SceneProps> = ({ children }) => {
  // Initialize zoom functionality
  const { scale, handleWheel, adjustScale } = useZoom();
  
  // Initialize scene dragging (with middle mouse button)
  const { position, elementRef, handlers } = useDrag<HTMLDivElement>({
    buttonIndex: 1, // Middle mouse button
    cursorDragging: 'grabbing',
    cursorNormal: 'auto'
  });

  // Handle mouse events for the scene
  const handleSceneMouseDown = (e: React.MouseEvent) => {
    // Only process middle mouse button events (button 1)
    if (e.button === 1) {
      handlers.onMouseDown(e);
    }
  };

  const handleSceneMouseMove = (e: React.MouseEvent) => {
    handlers.onMouseMove(e);
  };

  return (
    <SceneProvider scale={scale}>
      <div className="relative w-full h-screen overflow-hidden bg-secondary">
        {/* Scene container */}
        <div 
          ref={elementRef}
          className="w-full h-full"
          onWheel={handleWheel}
          onMouseDown={handleSceneMouseDown}
          onMouseMove={handleSceneMouseMove}
          onMouseUp={handlers.onMouseUp}
        >
          {/* Scene content */}
          <div 
            className="absolute top-1/2 left-1/2 w-full h-full transition-none"
            style={{ 
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` 
            }}
          >
            {/* Dot pattern background */}
            <DotBackground scale={scale} />
            
            {/* Scene children (draggable elements) */}
            {children}
          </div>
        </div>

        {/* Zoom controls */}
        <ZoomControls 
          scale={scale}
          onZoomIn={() => adjustScale(10)}
          onZoomOut={() => adjustScale(-10)}
        />
      </div>
    </SceneProvider>
  );
};

export default Scene; 