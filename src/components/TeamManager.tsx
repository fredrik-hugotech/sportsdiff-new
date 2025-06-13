interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

import React, { useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { useDraggable, useDroppable } from '@dnd-kit/core';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface Player {
  id: string;
  name: string;
  level: number;
  vest: boolean;
  teamId: string;
}

interface SavedTeam {
  id: string;
  user_id: string;
  name: string;
  team_data: Player[];
  created_at: string;
}

interface DroppableTeamProps {
  team: { id: string; name: string; players: Player[] };
  index: number;
  color: string;
  basePlayers: Player[];
  refreshKey: number;
}

function DroppableTeam({ team, index, color, basePlayers, refreshKey }: DroppableTeamProps) {
  const { setNodeRef } = useDroppable({ id: team.id });

  const avgVest = useMemo(() => {
    const vested = team.players.filter(p => p.vest);
    return vested.length > 0
      ? (vested.reduce((s, p) => s + p.level, 0) / vested.length).toFixed(2)
      : '-';
  }, [team.players, refreshKey]);

  const avgNoVest = useMemo(() => {
    const noVest = team.players.filter(p => !p.vest);
    return noVest.length > 0
      ? (noVest.reduce((s, p) => s + p.level, 0) / noVest.length).toFixed(2)
      : '-';
  }, [team.players, refreshKey]);

  const avgTotal = useMemo(() => {
    return team.players.length > 0
      ? (team.players.reduce((s, p) => s + p.level, 0) / team.players.length).toFixed(2)
      : '-';
  }, [team.players, refreshKey]);

  return (
    <div ref={setNodeRef} className={`border rounded-lg p-4 shadow-sm ${color}`}>
      <h4 className="font-semibold text-lg mb-2 text-gray-700">{team.name}</h4>
      <p className="text-sm text-gray-500 mb-2">
        {team.players.length} spillere – Snittnivå vest: {avgVest}, uten vest: {avgNoVest}, totalt: {avgTotal}
      </p>
      <ul className="space-y-1">
        {[...team.players]
          .sort((a, b) => b.level - a.level)
          .map(player => (
            <DraggablePlayer key={player.id} player={player} basePlayers={basePlayers} />
        ))}
      </ul>
    </div>
  );
}

interface DraggablePlayerProps extends Omit<React.ComponentPropsWithoutRef<'li'>, 'key'> {
  player: Player;
  basePlayers: Player[];
}

function DraggablePlayer({ player, basePlayers }: DraggablePlayerProps) {
  const { setNodeRef, attributes, listeners } = useDraggable({ id: player.id });

  const basePlayer = basePlayers.find(p => p.id === player.id);
  const baseLevel = basePlayer ? basePlayer.level : player.level;
  let trend: 'up' | 'down' | 'same' | null = null;
  if (player.level > baseLevel) trend = 'up';
  else if (player.level < baseLevel) trend = 'down';
  else trend = null;

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="text-sm text-gray-800 cursor-move"
    >
      {player.name} {player.vest ? '🦺' : ''}
      <span className="ml-1">
        {trend === 'up' ? '🔼' : trend === 'down' ? '🔽' : ''}
      </span>
    </li>
  );
}

export default function TeamManager({
  user,
  players,
  setPlayers,
  teams,
  refreshKey
}: {
  user: any;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  teams: { id: string; name: string; color: string }[];
  refreshKey: number;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100',
    red: 'bg-red-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    pink: 'bg-pink-100',
  };

  const fargeNavnMap: Record<string, string> = {
    blue: 'Blå',
    red: 'Rød',
    green: 'Grønn',
    yellow: 'Gul',
    purple: 'Lilla',
    pink: 'Rosa',
  };

  const [teamName, setTeamName] = useState('');
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);

  useEffect(() => {
    if (user) {
      supabase
        .from('saved_teams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false } as const)
        .then(({ data }) => {
          if (data) setSavedTeams(data);
        });
    }
  }, [user]);

  const saveTeam = async () => {
    if (!teamName.trim()) return;

    await supabase.from('saved_teams').insert({
      id: uuidv4(),
      user_id: user.id,
      name: teamName.trim(),
      team_data: players,
      created_at: new Date().toISOString()
    });

    setTeamName('');
    const { data } = await supabase
      .from('saved_teams')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false } as const);
    if (data) setSavedTeams(data);
  };

  const loadTeam = (team: SavedTeam) => {
    setPlayers(team.team_data);
  };

  const deleteTeam = async (teamId: string) => {
    await supabase
      .from('saved_teams')
      .delete()
      .eq('id', teamId);

    setSavedTeams(prev => prev.filter(t => t.id !== teamId));
  };

  const groupedTeams = useMemo(() => {
    return [...new Set(players.map(p => p.teamId))].map((teamId, index) => {
      const teamColor = teams.find(t => t.id === teamId)?.color || '';
      return {
        id: teamId,
        name: `Lag ${index + 1} – ${fargeNavnMap[teamColor] || 'Ukjent'}`,
        players: players
          .filter(p => p.teamId === teamId)
          .sort((a, b) => b.level - a.level)
      };
    });
  }, [players, teams]);

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      {groupedTeams.length > 0 ? (
        <div className="space-y-4">
          {groupedTeams.map((team, idx) => (
            <DroppableTeam key={`${team.id}-${refreshKey}`} team={team} index={idx} color={colorMap[teams.find(t => t.id === team.id)?.color || ''] || 'bg-gray-100'} basePlayers={players} refreshKey={refreshKey} />
          ))}
        </div>
      ) : (
        <p className="text-yellow-700 bg-yellow-100 border border-yellow-300 rounded p-3 text-center">
          Ingen lag er generert ennå. Legg til spillere for å se lagene her.
        </p>
      )}
      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">💾 Lagre eller hent laglister</h3>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Navn på lagliste"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={saveTeam}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow"
        >
          Lagre
        </button>
      </div>
      {savedTeams.length > 0 && (
        <div className="space-y-2">
          {savedTeams.map(team => (
            <div
              key={team.id}
              className="flex justify-between items-center bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg"
            >
              <span className="text-sm text-gray-800 font-medium">{team.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => loadTeam(team)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Last inn
                </button>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Slett
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
