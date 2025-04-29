'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Define types
export interface ConnectionPoint {
  cardId: string;
  position: { x: number; y: number };
  side: 'top' | 'right' | 'bottom' | 'left';
  nodeId: string;
}

// Manyetik yapışma için referans noktası
export interface MagneticTarget {
  nodeId: string;
  cardId: string;
  position: { x: number; y: number };
}

export interface ControlPoint {
  id: string;
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  source: ConnectionPoint;
  target: ConnectionPoint;
  isSelected?: boolean;
  controlPoints: ControlPoint[]; // Array of control points for each connection
}

export interface PreviewConnection {
  sourceCardId: string;
  sourcePosition: { x: number; y: number };
  sourceSide: 'top' | 'right' | 'bottom' | 'left';
  sourceNodeId: string;
  cursorPosition: { x: number; y: number };
  magneticTarget?: MagneticTarget; // Manyetik hedef noktası
  isReconnecting?: boolean;
  originalConnectionId?: string;
}

interface ConnectionContextType {
  connections: Connection[];
  previewConnection: PreviewConnection | null;
  selectedConnectionId: string | null;
  draggingControlPointId: string | null;
  allConnectionPoints: ConnectionPoint[]; // Tüm bağlantı noktaları
  startConnection: (
    cardId: string, 
    position: { x: number; y: number }, 
    side: 'top' | 'right' | 'bottom' | 'left',
    nodeId: string
  ) => void;
  movePreviewConnection: (cursorPosition: { x: number; y: number }) => void;
  endConnection: (
    targetCardId: string,
    targetPosition: { x: number; y: number },
    targetSide: 'top' | 'right' | 'bottom' | 'left',
    targetNodeId: string
  ) => boolean;
  cancelConnection: () => void;
  removeConnection: (connectionId: string) => void;
  updateConnectionNodePosition: (
    cardId: string,
    nodeId: string,
    position: { x: number; y: number },
    side: 'top' | 'right' | 'bottom' | 'left'
  ) => void;
  selectConnection: (connectionId: string | null) => void;
  startReconnectingConnection: (
    connectionId: string,
    newSourceCardId: string,
    newSourcePosition: { x: number; y: number },
    newSourceSide: 'top' | 'right' | 'bottom' | 'left',
    newSourceNodeId: string
  ) => void;
  hasOutgoingConnection: (nodeId: string) => boolean;
  addControlPoint: (
    connectionId: string,
    position: { x: number; y: number }
  ) => void;
  updateControlPoint: (
    connectionId: string,
    controlPointId: string,
    position: { x: number; y: number }
  ) => void;
  removeControlPoint: (
    connectionId: string,
    controlPointId: string
  ) => void;
  startDraggingControlPoint: (controlPointId: string) => void;
  endDraggingControlPoint: () => void;
  registerConnectionPoint: (point: ConnectionPoint) => void; // Bağlantı noktası kayıt fonksiyonu
  unregisterConnectionPoint: (nodeId: string) => void; // Bağlantı noktası kaydını silen fonksiyon
}

// Create context
const ConnectionContext = createContext<ConnectionContextType | null>(null);

// Provider component
export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [previewConnection, setPreviewConnection] = useState<PreviewConnection | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [draggingControlPointId, setDraggingControlPointId] = useState<string | null>(null);
  const [allConnectionPoints, setAllConnectionPoints] = useState<ConnectionPoint[]>([]);

  // Manyetik yapışma mesafesi (piksel)
  const MAGNETIC_THRESHOLD = 50;

  // Check if a node already has an outgoing connection
  const hasOutgoingConnection = useCallback((nodeId: string) => {
    return connections.some(connection => connection.source.nodeId === nodeId);
  }, [connections]);

  // Bağlantı noktalarını kaydetme
  const registerConnectionPoint = useCallback((point: ConnectionPoint) => {
    setAllConnectionPoints(prev => {
      // Eğer bu node ID'si zaten varsa, güncelle
      const exists = prev.some(p => p.nodeId === point.nodeId);
      if (exists) {
        return prev.map(p => p.nodeId === point.nodeId ? point : p);
      }
      // Yoksa ekle
      return [...prev, point];
    });
  }, []);

  // Bağlantı noktasını kaldırma
  const unregisterConnectionPoint = useCallback((nodeId: string) => {
    setAllConnectionPoints(prev => prev.filter(p => p.nodeId !== nodeId));
  }, []);

  // En yakın bağlantı noktasını bulma
  const findClosestConnectionPoint = useCallback((
    cursorPosition: { x: number; y: number },
    sourceCardId: string,
    sourceNodeId: string
  ): MagneticTarget | undefined => {
    // İlk olarak kendi card'ımızdaki ve kendi node'umuzdaki noktaları hariç tut
    const validPoints = allConnectionPoints.filter(point => 
      !(point.cardId === sourceCardId && point.nodeId === sourceNodeId)
    );
    
    if (validPoints.length === 0) return undefined;
    
    // En yakın noktayı bul
    let closestPoint = validPoints[0];
    let closestDistance = Math.hypot(
      cursorPosition.x - closestPoint.position.x,
      cursorPosition.y - closestPoint.position.y
    );
    
    validPoints.forEach(point => {
      const distance = Math.hypot(
        cursorPosition.x - point.position.x, 
        cursorPosition.y - point.position.y
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    });
    
    // Eğer mesafe eşik değerinden küçükse, bu noktayı döndür
    if (closestDistance <= MAGNETIC_THRESHOLD) {
      return {
        nodeId: closestPoint.nodeId,
        cardId: closestPoint.cardId,
        position: closestPoint.position
      };
    }
    
    return undefined;
  }, [allConnectionPoints]);

  // Reconnecting connection işlevi önce tanımlanmalı
  const startReconnectingConnection = useCallback((
    connectionId: string,
    newSourceCardId: string,
    newSourcePosition: { x: number; y: number },
    newSourceSide: 'top' | 'right' | 'bottom' | 'left',
    newSourceNodeId: string
  ) => {
    // Remove the old connection
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    
    // Start a new preview connection
    setPreviewConnection({
      sourceCardId: newSourceCardId,
      sourcePosition: newSourcePosition,
      sourceSide: newSourceSide,
      sourceNodeId: newSourceNodeId,
      cursorPosition: newSourcePosition,
      isReconnecting: true,
      originalConnectionId: connectionId
    });
  }, []);

  const startConnection = useCallback((
    cardId: string, 
    position: { x: number; y: number }, 
    side: 'top' | 'right' | 'bottom' | 'left',
    nodeId: string
  ) => {
    // Check if this node already has an outgoing connection
    if (hasOutgoingConnection(nodeId)) {
      // Find the existing connection to reconnect
      const existingConnection = connections.find(conn => conn.source.nodeId === nodeId);
      if (existingConnection) {
        startReconnectingConnection(
          existingConnection.id,
          cardId,
          position,
          side,
          nodeId
        );
        return;
      }
    }

    setPreviewConnection({
      sourceCardId: cardId,
      sourcePosition: position,
      sourceSide: side,
      sourceNodeId: nodeId,
      cursorPosition: position,
    });
  }, [connections, hasOutgoingConnection, startReconnectingConnection]);

  const movePreviewConnection = useCallback((cursorPosition: { x: number; y: number }) => {
    if (previewConnection) {
      // Manyetik yapışmayı kontrol et
      const magneticTarget = findClosestConnectionPoint(
        cursorPosition, 
        previewConnection.sourceCardId,
        previewConnection.sourceNodeId
      );
      
      // Eğer manyetik hedef varsa, cursor pozisyonunu onun pozisyonu olarak ayarla
      setPreviewConnection({
        ...previewConnection,
        cursorPosition: magneticTarget ? magneticTarget.position : cursorPosition,
        magneticTarget
      });
    }
  }, [previewConnection, findClosestConnectionPoint]);

  const endConnection = useCallback((
    targetCardId: string,
    targetPosition: { x: number; y: number },
    targetSide: 'top' | 'right' | 'bottom' | 'left',
    targetNodeId: string
  ) => {
    if (!previewConnection) return false;
    
    // Don't connect a card to itself with the same node
    if (previewConnection.sourceCardId === targetCardId && 
        previewConnection.sourceNodeId === targetNodeId) {
      setPreviewConnection(null);
      return false;
    }

    // Create new connection
    const newConnection: Connection = {
      id: `${previewConnection.sourceCardId}-${previewConnection.sourceNodeId}-${targetCardId}-${targetNodeId}`,
      source: {
        cardId: previewConnection.sourceCardId,
        position: previewConnection.sourcePosition,
        side: previewConnection.sourceSide,
        nodeId: previewConnection.sourceNodeId
      },
      target: {
        cardId: targetCardId,
        position: targetPosition,
        side: targetSide,
        nodeId: targetNodeId
      },
      controlPoints: [] // Initialize with no control points
    };
    
    setConnections(prev => {
      const updated = [...prev, newConnection];
      return updated;
    });
    
    setPreviewConnection(null);
    return true;
  }, [previewConnection]);

  const cancelConnection = useCallback(() => {
    setPreviewConnection(null);
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(connection => connection.id !== connectionId));
    if (selectedConnectionId === connectionId) {
      setSelectedConnectionId(null);
    }
  }, [selectedConnectionId]);

  // Update connection node positions when cards move
  const updateConnectionNodePosition = useCallback((
    cardId: string,
    nodeId: string,
    position: { x: number; y: number },
    side: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    setConnections(prev => 
      prev.map(connection => {
        // Update source position if it matches this node
        if (connection.source.cardId === cardId && connection.source.nodeId === nodeId) {
          return {
            ...connection,
            source: {
              ...connection.source,
              position,
              side
            }
          };
        }
        
        // Update target position if it matches this node
        if (connection.target.cardId === cardId && connection.target.nodeId === nodeId) {
          return {
            ...connection,
            target: {
              ...connection.target,
              position,
              side
            }
          };
        }
        
        // Return unchanged connection if no match
        return connection;
      })
    );
  }, []);

  // Select a connection for editing
  const selectConnection = useCallback((connectionId: string | null) => {
    setSelectedConnectionId(connectionId);
    
    // Update the isSelected flag on connections
    setConnections(prev => 
      prev.map(connection => ({
        ...connection,
        isSelected: connection.id === connectionId
      }))
    );
  }, []);

  // Add a control point to a connection
  const addControlPoint = useCallback((
    connectionId: string, 
    position: { x: number; y: number }
  ) => {
    setConnections(prev => 
      prev.map(connection => {
        if (connection.id === connectionId) {
          const newControlPointId = `control-${connectionId}-${Date.now()}`;
          const newControlPoint: ControlPoint = {
            id: newControlPointId,
            position
          };
          
          return {
            ...connection,
            controlPoints: [...connection.controlPoints, newControlPoint]
          };
        }
        return connection;
      })
    );
  }, []);

  // Update a control point position
  const updateControlPoint = useCallback((
    connectionId: string,
    controlPointId: string,
    position: { x: number; y: number }
  ) => {
    setConnections(prev => 
      prev.map(connection => {
        if (connection.id === connectionId) {
          return {
            ...connection,
            controlPoints: connection.controlPoints.map(cp => 
              cp.id === controlPointId 
                ? { ...cp, position }
                : cp
            )
          };
        }
        return connection;
      })
    );
  }, []);

  // Remove a control point
  const removeControlPoint = useCallback((
    connectionId: string,
    controlPointId: string
  ) => {
    setConnections(prev => 
      prev.map(connection => {
        if (connection.id === connectionId) {
          return {
            ...connection,
            controlPoints: connection.controlPoints.filter(cp => cp.id !== controlPointId)
          };
        }
        return connection;
      })
    );
  }, []);

  // Start dragging a control point
  const startDraggingControlPoint = useCallback((controlPointId: string) => {
    setDraggingControlPointId(controlPointId);
  }, []);

  // End dragging a control point
  const endDraggingControlPoint = useCallback(() => {
    setDraggingControlPointId(null);
  }, []);

  return (
    <ConnectionContext.Provider value={{
      connections,
      previewConnection,
      selectedConnectionId,
      draggingControlPointId,
      allConnectionPoints, // Yeni eklenen tüm bağlantı noktaları
      startConnection,
      movePreviewConnection,
      endConnection,
      cancelConnection,
      removeConnection,
      updateConnectionNodePosition,
      selectConnection,
      startReconnectingConnection,
      hasOutgoingConnection,
      addControlPoint,
      updateControlPoint,
      removeControlPoint,
      startDraggingControlPoint,
      endDraggingControlPoint,
      registerConnectionPoint, // Yeni eklenen bağlantı noktası kaydı fonksiyonu
      unregisterConnectionPoint, // Yeni eklenen bağlantı noktası kaydını silme fonksiyonu
    }}>
      {children}
    </ConnectionContext.Provider>
  );
};

// Custom hook to use the connection context
export const useConnectionContext = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnectionContext must be used within a ConnectionProvider');
  }
  return context;
}; 