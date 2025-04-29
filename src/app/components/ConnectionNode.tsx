'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useConnectionContext } from '../hooks/ConnectionContext';
import { useSceneContext } from '../hooks/SceneContext';

interface ConnectionNodeProps {
  cardId: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  position: number; // Percentage along the side (0-100)
  nodeId: string;
  parentPosition: { x: number, y: number }; // Parent card position
}

const ConnectionNode: React.FC<ConnectionNodeProps> = ({ 
  cardId, 
  side, 
  position, 
  nodeId,
  parentPosition
}) => {
  const { scale } = useSceneContext();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [nodePosition, setNodePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  
  const { 
    startConnection, 
    endConnection, 
    previewConnection,
    updateConnectionNodePosition,
    hasOutgoingConnection,
    registerConnectionPoint,
    unregisterConnectionPoint
  } = useConnectionContext();

  // Check if this node already has an outgoing connection
  const hasConnection = hasOutgoingConnection(nodeId);

  // Calculate if this node should be a drop target
  useEffect(() => {
    if (previewConnection && previewConnection.sourceCardId !== cardId) {
      setIsDropTarget(true);
    } else {
      setIsDropTarget(false);
    }
  }, [previewConnection, cardId]);

  // Function to calculate position - moved outside useEffect for reusability
  const calculateNodePosition = useCallback(() => {
    if (!nodeRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    const newPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    setNodePosition(newPosition);
    updateConnectionNodePosition(cardId, nodeId, newPosition, side);
    
    // Bağlantı noktasını kaydet
    registerConnectionPoint({
      cardId,
      nodeId,
      position: newPosition,
      side
    });
  }, [cardId, nodeId, side, updateConnectionNodePosition, registerConnectionPoint]);

  // Calculate node position relative to the card and update when card moves
  useEffect(() => {
    // Initial position calculation
    calculateNodePosition();
    
    // Create a ResizeObserver to detect changes in the scene
    const resizeObserver = new ResizeObserver(() => {
      calculateNodePosition();
    });
    
    // Create a MutationObserver to detect style changes (like position)
    const mutationObserver = new MutationObserver(() => {
      calculateNodePosition();
    });
    
    // Observe the node's parent (the card)
    if (nodeRef.current && nodeRef.current.parentElement) {
      resizeObserver.observe(nodeRef.current.parentElement);
      mutationObserver.observe(nodeRef.current.parentElement, {
        attributes: true,
        attributeFilter: ['style', 'class', 'transform'],
        subtree: false
      });
    } else {
      console.error(`Cannot find parent element for node ${nodeId}`);
    }
    
    // Register for scroll events too
    window.addEventListener('scroll', calculateNodePosition);
    
    // Setup an interval to periodically update positions as a fallback
    const intervalId = setInterval(() => {
      calculateNodePosition();
    }, 500);
    
    // Cleanup observers and event listeners
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', calculateNodePosition);
      clearInterval(intervalId);
      
      // Component unmount olduğunda bağlantı noktasını kaldır
      unregisterConnectionPoint(nodeId);
    };
  }, [scale, parentPosition, calculateNodePosition, cardId, nodeId, unregisterConnectionPoint]);

  // Determine node position style based on side
  const getNodeStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      backgroundColor: isHovering || isDropTarget 
        ? 'rgba(59, 130, 246, 0.8)' 
        : hasConnection 
          ? 'rgba(16, 185, 129, 0.6)' // Green for nodes with existing connections
          : 'rgba(59, 130, 246, 0.4)',
      border: '2px solid white',
      zIndex: 50,
      transition: 'transform 0.2s, background-color 0.2s',
      transform: (isHovering || isDropTarget) ? 'scale(1.2)' : 'scale(1)',
      pointerEvents: 'auto',
    };

    switch (side) {
      case 'top':
        return {
          ...baseStyle,
          top: '-7px',
          left: `calc(${position}% - 7px)`,
        };
      case 'right':
        return {
          ...baseStyle,
          top: `calc(${position}% - 7px)`,
          right: '-7px',
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: '-7px',
          left: `calc(${position}% - 7px)`,
        };
      case 'left':
        return {
          ...baseStyle,
          top: `calc(${position}% - 7px)`,
          left: '-7px',
        };
      default:
        return baseStyle;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    calculateNodePosition(); // Update position right before connecting
    startConnection(cardId, nodePosition, side, nodeId);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    calculateNodePosition(); // Update position right before connecting
    if (previewConnection && previewConnection.sourceCardId !== cardId) {
      const success = endConnection(cardId, nodePosition, side, nodeId);
    }
  };

  return (
    <div
      ref={nodeRef}
      style={getNodeStyle()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`cursor-pointer select-none connection-node ${isDropTarget ? 'pulse-animation' : ''}`}
      title={hasConnection ? "Tıkla: Bağlantıyı yeniden oluştur" : "Tıkla: Yeni bağlantı oluştur"}
    />
  );
};

export default ConnectionNode; 