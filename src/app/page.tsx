"use client";

import Scene from './components/Scene';
import DraggableCard from './components/DraggableCard';

export default function Home() {
  return (
    <Scene>
      <DraggableCard>
        <div className="w-full h-full p-4 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-primary">Interactive Scene</div>
          <div className="mt-4 text-muted-foreground">Use mouse scroll to zoom in/out</div>
          <div className="mt-2 text-muted-foreground">Middle click and drag to move scene</div>
          <div className="mt-2 text-muted-foreground">Left click and drag this card to move it</div>
        </div>
      </DraggableCard>
    </Scene>
  );
}
