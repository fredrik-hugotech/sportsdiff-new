import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

function DraggablePlayer({ player, playerId }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useDraggable({ id: playerId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ ...style, fontSize: "0.875rem" }}
      className="border rounded p-2 my-1 bg-white shadow-sm cursor-move"
    >
      {player.name}{" "}
      <span className="text-xs text-gray-400">(nivå {player.level})</span>
      {player.vest && (
        <span className="ml-2 text-xs font-semibold text-yellow-600">
          🪺 vest
        </span>
      )}
    </div>
  );
}

function DroppableTeam({ teamIndex, players }) {
  const { setNodeRef } = useDroppable({ id: `team-${teamIndex}` });
  return (
    <div ref={setNodeRef} className="min-h-[100px] border rounded p-2">
      {players.map((player) => (
        <DraggablePlayer
          key={player.id}
          player={player}
          playerId={player.id}
        />
      ))}
    </div>
  );
}

export default function LagGenerator() {
  const [spillerliste, setSpillerliste] = useState([{ name: "", level: "" }]);
  const [bulkPaste, setBulkPaste] = useState("");
  const [input, setInput] = useState("");
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const [mode, setMode] = useState("jevn");
  const [useVests, setUseVests] = useState(false);
  const [result, setResult] = useState([]);

  const handleBulkPaste = () => {
    const rows = bulkPaste.trim().split("\n");
    const parsed = rows.map((row, idx) => {
      const [name, level] = row.split("\t").map((cell) => cell.trim());
      return {
        name,
        level: parseFloat(level.replace(",", ".")) || 0,
        id: `player-${idx}`,
      };
    });
    setSpillerliste(parsed);
  };

  const normalize = (str) =>
    str?.toLowerCase().normalize("NFD").replace(/\s+/g, " ").replace(/[\u0300-\u036f]/g, "").trim();

  const handleGenerate = () => {
    const names = input
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const matched = names
      .map((name) =>
        spillerliste.find((p) => normalize(p.name) === normalize(name))
      )
      .filter(Boolean)
      .map((p, i) => ({ ...p, id: `${p.name}-${i}` }));

    if (matched.length === 0) return;

    const sorted = [...matched].sort((a, b) => b.level - a.level);
    const teamGroups = [];

    if (mode === "jevn") {
      const levels = [...sorted];
      const teams = Math.floor(levels.length / playersPerTeam);
      const remainders = levels.length % playersPerTeam;
      const tempTeams = Array.from(
        { length: teams + (remainders > 0 ? 1 : 0) },
        () => []
      );

      let forward = true;
      let t = 0;
      while (levels.length > 0) {
        tempTeams[t].push(levels.shift());
        if (forward) {
          t++;
          if (t >= tempTeams.length) {
            t = tempTeams.length - 1;
            forward = false;
          }
        } else {
          t--;
          if (t < 0) {
            t = 0;
            forward = true;
          }
        }
      }
      teamGroups.push(...tempTeams);
    } else {
      for (let i = 0; i < sorted.length; i += playersPerTeam) {
        teamGroups.push(sorted.slice(i, i + playersPerTeam));
      }
    }

    const result = teamGroups.map((group, index) => {
      const avg = (
        group.reduce((sum, p) => sum + parseFloat(p.level), 0) / group.length
      ).toFixed(2);
      const vester = useVests
        ? new Set(group.slice(0, Math.floor(group.length / 2)).map((p) => p.name))
        : new Set();
      const players = group.map((p) => ({
        ...p,
        vest: vester.has(p.name),
      }));
      return { name: `Lag ${index + 1}`, players, avg };
    });

    setResult(result);
  };

  const handleDragEnd = ({ active, over }) => {
    if (!active || !over) return;
    const activeTeamIndex = result.findIndex((team) =>
      team.players.some((p) => p.id === active.id)
    );
    const overTeamIndex = parseInt(over.id.split("-")[1]);
    if (activeTeamIndex === -1 || overTeamIndex === -1) return;

    const updated = [...result];
    const playerIndex = updated[activeTeamIndex].players.findIndex(
      (p) => p.id === active.id
    );
    const [moved] = updated[activeTeamIndex].players.splice(playerIndex, 1);
    updated[overTeamIndex].players.push(moved);

    updated.forEach((team) => {
      const avg = (
        team.players.reduce((sum, p) => sum + parseFloat(p.level), 0) /
        team.players.length
      ).toFixed(2);
      team.avg = avg;
    });

    setResult(updated);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Spilleroversikt og laggenerator</h1>

      <label className="block text-sm font-medium mb-1">
        Lim inn hele spillerlisten (Navn[TAB]Nivå):
      </label>
      <textarea
        className="w-full h-40 p-2 mb-2 border border-gray-300 rounded font-mono"
        placeholder="Leo Stormo Nupen\t1.2"
        value={bulkPaste}
        onChange={(e) => setBulkPaste(e.target.value)}
      />
      <Button onClick={handleBulkPaste} className="mb-6">
        Lim inn spillerliste
      </Button>

      <label className="block text-sm font-medium mb-1">
        Lim inn påmeldte spillere (én per linje):
      </label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Leo Stormo Nupen\nOlai Wiger"
        className="w-full h-40 p-2 rounded border border-gray-300 mb-4"
      />

      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-sm">Antall spillere per lag:</label>
          <input
            type="number"
            value={playersPerTeam}
            onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
            className="ml-2 w-20 border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="text-sm mr-2">Type lag:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="jevn">Jevne lag</option>
            <option value="differensiert">Differensierte lag</option>
          </select>
        </div>

        <div>
          <label className="text-sm mr-2">Bruk vester:</label>
          <input
            type="checkbox"
            checked={useVests}
            onChange={(e) => setUseVests(e.target.checked)}
            className="ml-1"
          />
        </div>

        <Button onClick={handleGenerate}>Generer lag</Button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:grid-cols-2">
          {result.map((lag, teamIndex) => (
            <Card key={lag.name}>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2">{lag.name}</h2>
                <p className="text-sm text-gray-500 mb-1">
                  Snittnivå: {lag.avg}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Antall spillere: {lag.players.length}
                </p>
                <DroppableTeam teamIndex={teamIndex} players={lag.players} />
              </CardContent>
            </Card>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
