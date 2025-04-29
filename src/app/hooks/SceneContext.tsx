'use client';

import React, { createContext, useContext } from 'react';

interface SceneContextType {
  scale: number;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const useSceneContext = () => {
  const context = useContext(SceneContext);
  if (context === undefined) {
    throw new Error('useSceneContext must be used within a SceneProvider');
  }
  return context;
};

export const SceneProvider: React.FC<SceneContextType & { children: React.ReactNode }> = ({ 
  scale, 
  children 
}) => {
  return (
    <SceneContext.Provider value={{ scale }}>
      {children}
    </SceneContext.Provider>
  );
};

export default SceneContext; 