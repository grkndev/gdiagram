'use client';

import React, { useEffect, useRef } from 'react';
import { useDrag } from '../hooks/useDrag';
import { useSceneContext } from '../hooks/SceneContext';
import { useConnectionContext } from '../hooks/ConnectionContext';
import ConnectionNode from './ConnectionNode';

interface DraggableCardProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
  id: string; // Unique ID for the card
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  children,
  width = 600,
  height = 400,
  className = '',
  id
}) => {
  // Get scale from context
  const { scale } = useSceneContext();
  const { movePreviewConnection, previewConnection, cancelConnection, selectConnection } = useConnectionContext();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { position, elementRef, handlers } = useDrag<HTMLDivElement>({
    buttonIndex: 0, // Left mouse button
    cursorNormal: 'grab',
    cursorDragging: 'grabbing'
  });

  // Update the preview connection position when dragging a connection
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (previewConnection) {
        movePreviewConnection({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalMouseUp = () => {
      if (previewConnection) {
        cancelConnection();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [previewConnection, movePreviewConnection, cancelConnection]);

  // Define connection nodes
  const connectionNodes = [
    // Top edge nodes
    { id: `${id}-top-25`, side: 'top' as const, position: 25 },
    { id: `${id}-top-50`, side: 'top' as const, position: 50 },
    { id: `${id}-top-75`, side: 'top' as const, position: 75 },
    
    // Right edge nodes
    { id: `${id}-right-25`, side: 'right' as const, position: 25 },
    { id: `${id}-right-50`, side: 'right' as const, position: 50 },
    { id: `${id}-right-75`, side: 'right' as const, position: 75 },
    
    // Bottom edge nodes
    { id: `${id}-bottom-25`, side: 'bottom' as const, position: 25 },
    { id: `${id}-bottom-50`, side: 'bottom' as const, position: 50 },
    { id: `${id}-bottom-75`, side: 'bottom' as const, position: 75 },
    
    // Left edge nodes
    { id: `${id}-left-25`, side: 'left' as const, position: 25 },
    { id: `${id}-left-50`, side: 'left' as const, position: 50 },
    { id: `${id}-left-75`, side: 'left' as const, position: 75 },
  ];

  // Render connection nodes
  const renderConnectionNodes = () => {
    return connectionNodes.map(node => (
      <ConnectionNode
        key={node.id}
        cardId={id}
        nodeId={node.id}
        side={node.side}
        position={node.position}
        parentPosition={position}
      />
    ));
  };

  // Handle mousedown event - deselect connections but still allow dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle card content clicks, not connection node clicks
    if ((e.target as HTMLElement).closest('.connection-node')) {
      return;
    }
    
    // Prevent text selection
    e.preventDefault();
    
    // Deselect any connection
    selectConnection(null);
    
    // Pass the event to the drag handler
    handlers.onMouseDown(e);
  };

  return (
    <div 
      ref={elementRef}
      className={`absolute top-1/2 left-1/2 bg-white rounded-md shadow-lg select-none ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale / 100})`,
        transformOrigin: 'center',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
    >
      {children || (
        <div className="w-full h-full p-4 flex flex-col items-center justify-center select-none">
          <div className="text-2xl font-bold text-primary">Draggable Card</div>
          <div className="mt-4 text-muted-foreground">Left click and drag to move this card</div>
          <div className="mt-2 text-muted-foreground">Click on connection points to create links</div>
        </div>
      )}
      
      {/* Add connection nodes */}
      {renderConnectionNodes()}
    </div>
  );
};

export default DraggableCard; 