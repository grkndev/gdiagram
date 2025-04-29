'use client';

import React from 'react';
import { useDrag } from '../hooks/useDrag';
import { useSceneContext } from '../hooks/SceneContext';

interface DraggableCardProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  children,
  width = 600,
  height = 400,
  className = ''
}) => {
  // Get scale from context
  const { scale } = useSceneContext();
  
  const { position, elementRef, handlers } = useDrag<HTMLDivElement>({
    buttonIndex: 0, // Left mouse button
    cursorNormal: 'grab',
    cursorDragging: 'grabbing'
  });

  return (
    <div 
      ref={elementRef}
      className={`absolute top-1/2 left-1/2 bg-white rounded-md shadow-lg ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale / 100})`,
        transformOrigin: 'center',
      }}
      onMouseDown={handlers.onMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
    >
      {children || (
        <div className="w-full h-full p-4 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-primary">Draggable Card</div>
          <div className="mt-4 text-muted-foreground">Left click and drag to move this card</div>
        </div>
      )}
    </div>
  );
};

export default DraggableCard; 