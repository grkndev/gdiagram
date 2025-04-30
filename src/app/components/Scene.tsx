'use client';

import React, { useEffect, useRef } from 'react';
import { useDrag } from '../hooks/useDrag';
import { useZoom } from '../hooks/useZoom';
import { SceneProvider } from '../hooks/SceneContext';
import { ConnectionProvider } from '../hooks/ConnectionContext';
import DotBackground from './DotBackground';
import ZoomControls from './ZoomControls';
import Connections from './Connections';

interface SceneProps {
  children?: React.ReactNode;
}

export const Scene: React.FC<SceneProps> = ({ children }) => {
  // Initialize zoom functionality
  const { scale, handleWheel, adjustScale } = useZoom();
  const sceneRef = useRef<HTMLDivElement>(null);

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

    // Prevent text selection
    e.preventDefault();
  };

  const handleSceneMouseMove = (e: React.MouseEvent) => {
    handlers.onMouseMove(e);
  };

  // Use effect to add selectstart event listener
  useEffect(() => {
    const sceneElement = sceneRef.current;

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    if (sceneElement) {
      sceneElement.addEventListener('selectstart', handleSelectStart);
    }

    return () => {
      if (sceneElement) {
        sceneElement.removeEventListener('selectstart', handleSelectStart);
      }
    };
  }, []);

  return (
    <SceneProvider scale={scale}>
      <ConnectionProvider>
        <div
          ref={sceneRef}
          className="relative w-full h-screen overflow-hidden bg-secondary select-none"
        >
          {/* Scene container */}
          <div
            ref={elementRef}
            className="w-full h-full select-none"
            onWheel={handleWheel}
            onMouseDown={handleSceneMouseDown}
            onMouseMove={handleSceneMouseMove}
            onMouseUp={handlers.onMouseUp}
          >
            {/* Scene content */}
            <div
              className="absolute top-1/2 left-1/2 w-full h-full transition-none select-none"
              style={{
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                zoom: scale/100,
                transformStyle: 'preserve-3d',
                transformOrigin: 'center',
              }}
            >
              {/* Dot pattern background */}
              <DotBackground scale={scale} />

              {/* Connections between cards */}
              <Connections />

              {/* Scene children (draggable elements) */}
              <div style={{ pointerEvents: 'auto' }}>
                {children}
              </div>
            </div>
          </div>

          {/* Zoom controls */}
          <ZoomControls
            scale={scale}
            onZoomIn={() => adjustScale(10)}
            onZoomOut={() => adjustScale(-10)}
          />
        </div>
      </ConnectionProvider>
    </SceneProvider>
  );
};

export default Scene; 