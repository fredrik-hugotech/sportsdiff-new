import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Draggable component for each player
function DraggablePlayer({ id, name, container }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useDraggable({ id, data: { container } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-gray-200 p-2 m-1 rounded cursor-grab"
    >
      {name}
    </div>
  );
}

// Droppable column representing a team or the unassigned list
function DroppableColumn({ id, label, players }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const highlight = isOver ? "bg-gray-100" : "";
  return (
    <Card className="w-full">
      <CardContent ref={setNodeRef} className={`min-h-[120px] ${highlight}`}>
        <h2 className="font-semibold mb-2">{label}</h2>
        {players.map((p) => (
          <DraggablePlayer
            key={p.id}
            id={p.id}
            name={p.name}
            container={id}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function LagGenerator() {
  const [players, setPlayers] = useState([
    { id: "p1", name: "Spiller 1", container: "unassigned" },
    { id: "p2", name: "Spiller 2", container: "unassigned" },
  ]);
  const [newPlayer, setNewPlayer] = useState("");

  const movePlayer = (id, container) => {
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, container } : p)));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const origin = active.data.current?.container;
    const destination = over.id;
    if (origin === destination) return;
    movePlayer(active.id, destination);
  };

  const handleAddPlayer = () => {
    if (!newPlayer.trim()) return;
    const id = Date.now().toString();
    setPlayers((ps) => [
      ...ps,
      { id, name: newPlayer.trim(), container: "unassigned" },
    ]);
    setNewPlayer("");
  };

  const generateRandomTeams = () => {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const half = Math.ceil(shuffled.length / 2);
    setPlayers(
      shuffled.map((p, idx) => ({
        ...p,
        container: idx < half ? "teamA" : "teamB",
      }))
    );
  };

  const unassigned = players.filter((p) => p.container === "unassigned");
  const teamA = players.filter((p) => p.container === "teamA");
  const teamB = players.filter((p) => p.container === "teamB");

  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-2">
        <input
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Ny spiller"
          className="border p-2 rounded flex-1"
        />
        <Button onClick={handleAddPlayer}>Legg til spiller</Button>
        <Button onClick={generateRandomTeams}>Generer lag</Button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-4">
          <DroppableColumn id="unassigned" label="Utenfor lag" players={unassigned} />
          <DroppableColumn id="teamA" label="Lag A" players={teamA} />
          <DroppableColumn id="teamB" label="Lag B" players={teamB} />
        </div>
      </DndContext>
    </div>
  );
}

export default LagGenerator;
