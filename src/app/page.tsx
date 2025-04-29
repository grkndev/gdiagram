"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [scale, setScale] = useState(100);
  const [scenePosition, setScenePosition] = useState({ x: 0, y: 0 });
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [isSceneDragging, setIsSceneDragging] = useState(false);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    setScale(prevScale => {
      const newScale = delta > 0 
        ? Math.max(10, prevScale - 5) 
        : Math.min(300, prevScale + 5);
      return newScale;
    });
  };

  const adjustScale = (amount: number) => {
    setScale(prevScale => {
      const newScale = Math.max(10, Math.min(300, prevScale + amount));
      return newScale;
    });
  };

  // Scene dragging - with middle mouse button
  const handleSceneMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if middle mouse button (button 1) is pressed
    if (e.button !== 1) return;
    
    setIsSceneDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    // Change cursor style during drag
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
    
    // Prevent default behavior
    e.preventDefault();
  };

  // Card dragging - with left mouse button
  const handleCardMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if left mouse button (button 0) is pressed
    if (e.button !== 0) return;
    
    setIsCardDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    if (cardRef.current) {
      cardRef.current.style.cursor = 'grabbing';
    }
    
    // Prevent event from bubbling to prevent scene dragging
    e.stopPropagation();
    // Prevent default behavior
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Calculate the mouse movement delta since last position
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    // Update the last mouse position for next calculation
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    // Update scene position if scene is being dragged
    if (isSceneDragging) {
      setScenePosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }
    
    // Update card position if card is being dragged
    if (isCardDragging) {
      setCardPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }
  };

  const handleMouseUp = () => {
    // Reset scene dragging
    if (isSceneDragging) {
      setIsSceneDragging(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = 'auto';
      }
    }
    
    // Reset card dragging
    if (isCardDragging) {
      setIsCardDragging(false);
      if (cardRef.current) {
        cardRef.current.style.cursor = 'grab';
      }
    }
  };

  useEffect(() => {
    // Add mouse up event listener to window to ensure dragging stops
    // even if the mouse button is released outside the component
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Add this effect to initialize the cursor style
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.cursor = 'grab';
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-secondary">
      {/* Scene container */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        onWheel={handleWheel}
        onMouseDown={handleSceneMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Scene content */}
        <div 
          className="absolute top-1/2 left-1/2 w-full h-full transition-none"
          style={{ 
            transform: `translate(calc(-50% + ${scenePosition.x}px), calc(-50% + ${scenePosition.y}px))` 
          }}
        >
          {/* Dot pattern background */}
          <div 
            className="absolute top-0 left-0 w-[6000px] h-[6000px]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(100,100,100,0.3) 1px, transparent 1px)',
              backgroundSize: `${25 * scale / 100}px ${25 * scale / 100}px`,
              backgroundPosition: 'center center',
              transform: `translate(-50%, -50%) scale(${scale / 100})`,
              transformOrigin: 'center',
            }}
          />

          {/* Example content */}
          <div 
            ref={cardRef}
            className="absolute top-1/2 left-1/2 w-[600px] h-[400px] bg-white rounded-md shadow-lg"
            style={{
              transform: `translate(calc(-50% + ${cardPosition.x}px), calc(-50% + ${cardPosition.y}px)) scale(${scale / 100})`,
              transformOrigin: 'center',
            }}
            onMouseDown={handleCardMouseDown}
          >
            <div className="w-full h-full p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-primary">Zoomable Scene</div>
              <div className="mt-4 text-muted-foreground">Use mouse scroll to zoom in/out</div>
              <div className="mt-2 text-muted-foreground">Middle click and drag to move scene</div>
              <div className="mt-2 text-muted-foreground">Left click and drag this card to move it</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-popover rounded-md p-2 shadow-md z-10">
        <button 
          onClick={() => adjustScale(-10)} 
          className="w-8 h-8 flex items-center justify-center bg-secondary rounded-md hover:bg-secondary/80"
        >
          -
        </button>
        <div className="min-w-[60px] text-center font-mono">
          {scale}%
        </div>
        <button 
          onClick={() => adjustScale(10)} 
          className="w-8 h-8 flex items-center justify-center bg-secondary rounded-md hover:bg-secondary/80"
        >
          +
        </button>
      </div>
    </div>
  );
}
