'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useConnectionContext } from '../hooks/ConnectionContext';
import { useSceneContext } from '../hooks/SceneContext';

const Connections: React.FC = () => {
  const { 
    connections, 
    previewConnection, 
    selectConnection, 
    selectedConnectionId,
    removeConnection 
  } = useConnectionContext();
  const { scale } = useSceneContext();
  const [, forceUpdate] = useState({});
  const svgRef = useRef<SVGSVGElement>(null);

  // Force re-render on window resize to update connection positions
  useEffect(() => {
    const handleResize = () => forceUpdate({});
    window.addEventListener('resize', handleResize);
    
    // Update when scale changes
    forceUpdate({});
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [scale]);

  // Handle click on connection to select it
  const handleConnectionClick = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default behavior
    selectConnection(connectionId === selectedConnectionId ? null : connectionId);
  };

  // Handle delete button click
  const handleDeleteConnection = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default behavior
    removeConnection(connectionId);
  };

  // Render connection controls (delete button, etc.)
  const renderConnectionControls = (connection: any) => {
    if (connection.id !== selectedConnectionId) return null;

    // Get the midpoint of the connection for placing controls
    const sourceX = connection.source.position.x;
    const sourceY = connection.source.position.y;
    const targetX = connection.target.position.x;
    const targetY = connection.target.position.y;
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    return (
      <g>
        {/* Delete button */}
        <circle 
          cx={midX} 
          cy={midY} 
          r={12}
          fill="rgba(239, 68, 68, 0.9)" // Red background
          stroke="#fff"
          strokeWidth={1}
          className="cursor-pointer"
          onClick={(e) => handleDeleteConnection(e, connection.id)}
        />
        <text 
          x={midX} 
          y={midY} 
          textAnchor="middle" 
          dominantBaseline="middle"
          fill="#fff"
          fontSize={14}
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          ×
        </text>
      </g>
    );
  };

  // Get actual position considering the scale
  const getScaledPosition = (position: { x: number, y: number }) => {
    if (!svgRef.current) return position;

    const svgRect = svgRef.current.getBoundingClientRect();
    return {
      x: position.x - svgRect.left,
      y: position.y - svgRect.top
    };
  };

  // Render the active connections
  const renderConnections = () => {
    return connections.map((connection) => {
      // Get scaled positions
      const sourcePos = getScaledPosition(connection.source.position);
      const targetPos = getScaledPosition(connection.target.position);
      
      // Create SVG path between the two points
      const sourceX = sourcePos.x;
      const sourceY = sourcePos.y;
      const targetX = targetPos.x;
      const targetY = targetPos.y;
      
      // Calculate control points for the curve
      const dx = Math.abs(targetX - sourceX) * 0.5;
      const dy = Math.abs(targetY - sourceY) * 0.5;
      
      let sourceCx: number, sourceCy: number, targetCx: number, targetCy: number;
      
      // Adjust control points based on which sides the connections are on
      switch (connection.source.side) {
        case 'top': 
          sourceCx = sourceX; sourceCy = sourceY - dy; 
          break;
        case 'right': 
          sourceCx = sourceX + dx; sourceCy = sourceY; 
          break;
        case 'bottom': 
          sourceCx = sourceX; sourceCy = sourceY + dy; 
          break;
        case 'left': 
          sourceCx = sourceX - dx; sourceCy = sourceY; 
          break;
      }
      
      switch (connection.target.side) {
        case 'top': 
          targetCx = targetX; targetCy = targetY - dy; 
          break;
        case 'right': 
          targetCx = targetX + dx; targetCy = targetY; 
          break;
        case 'bottom': 
          targetCx = targetX; targetCy = targetY + dy; 
          break;
        case 'left': 
          targetCx = targetX - dx; targetCy = targetY; 
          break;
      }
      
      const path = `M ${sourceX} ${sourceY} C ${sourceCx} ${sourceCy}, ${targetCx} ${targetCy}, ${targetX} ${targetY}`;

      const isSelected = connection.id === selectedConnectionId;
      
      return (
        <g key={connection.id} className="connection">
          <path
            d={path}
            stroke={isSelected ? "#f59e0b" : "#3b82f6"}
            strokeWidth={isSelected ? 3 : 2}
            fill="none"
            strokeLinecap="round"
            className="cursor-pointer connection-path"
            onClick={(e) => handleConnectionClick(e, connection.id)}
            strokeDasharray={isSelected ? "" : ""}
          />
          {renderConnectionControls(connection)}
        </g>
      );
    });
  };

  // Render the preview connection when dragging
  const renderPreviewConnection = () => {
    if (!previewConnection) return null;
    
    // Get scaled positions
    const sourcePos = getScaledPosition(previewConnection.sourcePosition);
    const cursorPos = getScaledPosition(previewConnection.cursorPosition);
    
    const sourceX = sourcePos.x;
    const sourceY = sourcePos.y;
    const targetX = cursorPos.x;
    const targetY = cursorPos.y;
    
    // Calculate control points for the curve
    const dx = Math.abs(targetX - sourceX) * 0.5;
    const dy = Math.abs(targetY - sourceY) * 0.5;
    
    let sourceCx: number, sourceCy: number;
    
    // Adjust source control point based on which side the connection starts from
    switch (previewConnection.sourceSide) {
      case 'top': 
        sourceCx = sourceX; sourceCy = sourceY - dy; 
        break;
      case 'right': 
        sourceCx = sourceX + dx; sourceCy = sourceY; 
        break;
      case 'bottom': 
        sourceCx = sourceX; sourceCy = sourceY + dy; 
        break;
      case 'left': 
        sourceCx = sourceX - dx; sourceCy = sourceY; 
        break;
    }
    
    const path = `M ${sourceX} ${sourceY} C ${sourceCx} ${sourceCy}, ${targetX} ${targetY}, ${targetX} ${targetY}`;
    
    return (
      <path
        d={path}
        stroke="#3b82f6"
        strokeWidth={2}
        fill="none"
        strokeDasharray="5,5"
        strokeLinecap="round"
        className="connection-preview"
      />
    );
  };

  // Handle click on SVG background to deselect connection
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only handle direct background clicks, not through connections
    if ((e.target as SVGElement).classList.contains('connection') || 
        (e.target as SVGElement).classList.contains('connection-path') ||
        (e.target as SVGElement).classList.contains('connection-preview')) {
      return;
    }
    
    selectConnection(null);
  };

  return (
    <svg 
      ref={svgRef}
      className="absolute top-0 left-0 w-full h-full" 
      style={{ zIndex: 5, pointerEvents: 'none' }}
      onClick={handleBackgroundClick}
    >
      <g style={{ pointerEvents: 'auto' }}>
        {renderConnections()}
        {renderPreviewConnection()}
      </g>
    </svg>
  );
};

export default Connections; 