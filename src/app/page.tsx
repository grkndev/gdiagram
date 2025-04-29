"use client";

import Scene from './components/Scene';
import DraggableCard from './components/DraggableCard';

export default function Home() {
  return (
    <Scene>
      <DraggableCard 
        id="card-1" 
        width={400}
        height={300}
        className="bg-white/90 border border-primary/20"
      >
        <div className="w-full h-full p-4 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-primary">Card 1</div>
          <div className="mt-4 text-muted-foreground">Drag me around!</div>
          <div className="mt-2 text-muted-foreground">Connect me to other cards</div>
        </div>
      </DraggableCard>
      
      <DraggableCard 
        id="card-2"
        width={400}
        height={300}
        className="bg-white/90 border border-primary/20"
      >
        <div className="w-full h-full p-4 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-primary">Card 2</div>
          <div className="mt-4 text-muted-foreground">Drag me around!</div>
          <div className="mt-2 text-muted-foreground">Connect me to other cards</div>
        </div>
      </DraggableCard>
      
      <DraggableCard 
        id="card-3"
        width={400}
        height={300}
        className="bg-white/90 border border-primary/20"
      >
        <div className="w-full h-full p-4 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-primary">Card 3</div>
          <div className="mt-4 text-muted-foreground">Drag me around!</div>
          <div className="mt-2 text-muted-foreground">Connect me to other cards</div>
        </div>
      </DraggableCard>
    </Scene>
  );
}
