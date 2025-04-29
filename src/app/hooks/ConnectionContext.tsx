'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Define types
export interface ConnectionPoint {
  cardId: string;
  position: { x: number; y: number };
  side: 'top' | 'right' | 'bottom' | 'left';
  nodeId: string;
}

export interface Connection {
  id: string;
  source: ConnectionPoint;
  target: ConnectionPoint;
  isSelected?: boolean;
}

export interface PreviewConnection {
  sourceCardId: string;
  sourcePosition: { x: number; y: number };
  sourceSide: 'top' | 'right' | 'bottom' | 'left';
  sourceNodeId: string;
  cursorPosition: { x: number; y: number };
  isReconnecting?: boolean;
  originalConnectionId?: string;
}

interface ConnectionContextType {
  connections: Connection[];
  previewConnection: PreviewConnection | null;
  selectedConnectionId: string | null;
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
}

// Create context
const ConnectionContext = createContext<ConnectionContextType | null>(null);

// Provider component
export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [previewConnection, setPreviewConnection] = useState<PreviewConnection | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Check if a node already has an outgoing connection
  const hasOutgoingConnection = useCallback((nodeId: string) => {
    return connections.some(connection => connection.source.nodeId === nodeId);
  }, [connections]);

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
  }, [connections, hasOutgoingConnection]);

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

  const movePreviewConnection = useCallback((cursorPosition: { x: number; y: number }) => {
    if (previewConnection) {
      setPreviewConnection({
        ...previewConnection,
        cursorPosition,
      });
    }
  }, [previewConnection]);

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
      }
    };

    setConnections(prev => [...prev, newConnection]);
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

  // New function to update connection node positions when cards move
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

  return (
    <ConnectionContext.Provider value={{
      connections,
      previewConnection,
      selectedConnectionId,
      startConnection,
      movePreviewConnection,
      endConnection,
      cancelConnection,
      removeConnection,
      updateConnectionNodePosition,
      selectConnection,
      startReconnectingConnection,
      hasOutgoingConnection
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