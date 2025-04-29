'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useConnectionContext } from '../hooks/ConnectionContext';
import { useSceneContext } from '../hooks/SceneContext';

const Connections: React.FC = () => {
  const { 
    connections, 
    previewConnection, 
    selectConnection, 
    selectedConnectionId,
    removeConnection,
    addControlPoint,
    updateControlPoint,
    removeControlPoint,
    startDraggingControlPoint,
    endDraggingControlPoint,
    draggingControlPointId
  } = useConnectionContext();
  const { scale } = useSceneContext();
  const [, forceUpdate] = useState({});
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDraggingControlPoint, setIsDraggingControlPoint] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });

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

  // Handle mouse events for dragging control points
  useEffect(() => {
    if (!isDraggingControlPoint) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      
      const svgRect = svgRef.current.getBoundingClientRect();
      const mousePos = {
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top
      };
      
      setDragCurrentPos(mousePos);
      
      // Find the connection and control point being dragged
      if (draggingControlPointId) {
        // Find the connection that contains this control point
        const connection = connections.find(conn => 
          conn.controlPoints.some(cp => cp.id === draggingControlPointId)
        );
        
        if (connection) {
          // Update the control point position
          updateControlPoint(connection.id, draggingControlPointId, mousePos);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDraggingControlPoint(false);
      endDraggingControlPoint();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingControlPoint, draggingControlPointId, connections, updateControlPoint, endDraggingControlPoint]);

  // Handle click on connection to select it
  const handleConnectionClick = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default behavior
    selectConnection(connectionId === selectedConnectionId ? null : connectionId);
  };

  // Handle double click on connection to add a control point
  const handleConnectionDoubleClick = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const clickPos = {
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top
    };
    
    // Add a new control point at the clicked position
    addControlPoint(connectionId, clickPos);
    
    // Select the connection if not already selected
    if (selectedConnectionId !== connectionId) {
      selectConnection(connectionId);
    }
  };

  // Handle delete button click
  const handleDeleteConnection = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default behavior
    removeConnection(connectionId);
  };

  // Handle control point mouse down (start dragging)
  const handleControlPointMouseDown = (e: React.MouseEvent, controlPointId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top
    };
    
    setDragStartPos(mousePos);
    setDragCurrentPos(mousePos);
    setIsDraggingControlPoint(true);
    startDraggingControlPoint(controlPointId);
  };

  // Handle control point right click (remove control point)
  const handleControlPointRightClick = (e: React.MouseEvent, connectionId: string, controlPointId: string) => {
    e.stopPropagation();
    e.preventDefault();
    removeControlPoint(connectionId, controlPointId);
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

  // Calculate path with control points - now using straight lines
  const calculatePath = (
    sourceX: number, sourceY: number, 
    targetX: number, targetY: number, 
    controlPoints: any[]
  ) => {
    if (controlPoints.length === 0) {
      // Simple straight line with no control points
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    } else {
      // Complex path with straight lines through control points
      // Start with the source point
      let path = `M ${sourceX} ${sourceY}`;
      
      // Sort control points by distance from source
      const sortedPoints = [...controlPoints].sort((a, b) => {
        const distA = Math.hypot(a.position.x - sourceX, a.position.y - sourceY);
        const distB = Math.hypot(b.position.x - sourceX, b.position.y - sourceY);
        return distA - distB;
      });
      
      // Add straight line to each control point
      for (const point of sortedPoints) {
        path += ` L ${point.position.x} ${point.position.y}`;
      }
      
      // Finally add straight line to target
      path += ` L ${targetX} ${targetY}`;
      
      return path;
    }
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
      
      // Get the path with control points
      const path = calculatePath(sourceX, sourceY, targetX, targetY, connection.controlPoints);
      
      const isSelected = connection.id === selectedConnectionId;
      
      return (
        <g key={connection.id} className="connection">
          <path
            d={path}
            stroke={isSelected ? "#f59e0b" : "#3b82f6"}
            strokeWidth={isSelected ? 3 : 2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-pointer connection-path"
            onClick={(e) => handleConnectionClick(e, connection.id)}
            onDoubleClick={(e) => handleConnectionDoubleClick(e, connection.id)}
            strokeDasharray={isSelected ? "" : ""}
          />
          
          {/* Kontrol noktalarına bağlantı yerleri vurgulaması */}
          {connection.controlPoints.map((cp) => (
            <circle
              key={`dot-${cp.id}`}
              cx={cp.position.x}
              cy={cp.position.y}
              r={3}
              fill={isSelected ? "#f59e0b" : "#3b82f6"}
              opacity={0.7}
              pointerEvents="none"
            />
          ))}
          
          {/* Render control points if connection is selected */}
          {isSelected && connection.controlPoints.map((cp) => (
            <g key={cp.id} className="control-point">
              <circle
                cx={cp.position.x}
                cy={cp.position.y}
                r={6}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={1}
                className="cursor-move"
                onMouseDown={(e) => handleControlPointMouseDown(e, cp.id)}
                onContextMenu={(e) => handleControlPointRightClick(e, connection.id, cp.id)}
              />
            </g>
          ))}
          
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
    
    // Düz çizgi kullan (eğrili yerine)
    const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    
    return (
      <>
        <path
          d={path}
          stroke="#3b82f6"
          strokeWidth={2}
          fill="none"
          strokeDasharray="5,5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="connection-preview"
        />
        
        {/* Manyetik hedef varsa vurgula */}
        {previewConnection.magneticTarget && (
          <circle
            cx={targetX}
            cy={targetY}
            r={10}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            strokeWidth={2}
            className="pulse-animation"
          />
        )}
      </>
    );
  };

  // Handle click on SVG background to deselect connection
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only handle direct background clicks, not through connections
    if ((e.target as SVGElement).classList.contains('connection') || 
        (e.target as SVGElement).classList.contains('connection-path') ||
        (e.target as SVGElement).classList.contains('connection-preview') ||
        (e.target as SVGElement).classList.contains('control-point')) {
      return;
    }
    
    selectConnection(null);
  };

  return (
    <svg 
      ref={svgRef}
      className="absolute top-0 left-0 w-full h-full" 
      style={{ zIndex: 40, pointerEvents: 'none' }}
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