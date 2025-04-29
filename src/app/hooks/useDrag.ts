import { useState, useEffect, useRef, RefObject } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDragOptions {
  buttonIndex?: number;
  initialPosition?: Position;
  cursorDragging?: string;
  cursorNormal?: string;
}

export const useDrag = <T extends HTMLElement>({
  buttonIndex = 0,
  initialPosition = { x: 0, y: 0 },
  cursorDragging = 'grabbing',
  cursorNormal = 'grab'
}: UseDragOptions = {}) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Position>({ x: 0, y: 0 });
  const elementRef = useRef<T>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only activate if the specified mouse button is pressed
    if (e.button !== buttonIndex) return;
    
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    // Update cursor
    if (elementRef.current) {
      elementRef.current.style.cursor = cursorDragging;
    }
    
    // Stop propagation if needed to prevent parent handlers from activating
    if (buttonIndex === 0) {
      e.stopPropagation();
    }
    
    // Prevent default browser behavior
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate deltas
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    // Update last position for next calculation
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    // Update element position
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    // Prevent default to avoid text selection
    e.preventDefault();
    
    // Stop propagation to prevent other elements from responding
    e.stopPropagation();
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Reset cursor
    if (elementRef.current) {
      elementRef.current.style.cursor = cursorNormal;
    }
  };

  // Global event handlers for when mouse moves outside the element
  useEffect(() => {
    if (!isDragging) return;
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate deltas
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      // Update last position
      setLastMousePos({ x: e.clientX, y: e.clientY });
      
      // Update position
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    };
    
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        
        if (elementRef.current) {
          elementRef.current.style.cursor = cursorNormal;
        }
      }
    };
    
    // Add global event listeners
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, lastMousePos.x, lastMousePos.y, cursorNormal]);

  // Initialize cursor style
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.style.cursor = cursorNormal;
    }
  }, [cursorNormal]);

  return {
    position,
    setPosition,
    isDragging,
    elementRef,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp
    }
  };
}; 