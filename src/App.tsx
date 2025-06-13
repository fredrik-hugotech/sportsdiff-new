import React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient';
import PremiumAccess from './PremiumAccess';
import TeamManager from './components/TeamManager';
import TeamSelector from './components/TeamSelector';
import { Link } from 'react-router-dom';
// import PlayerListUploader from './components/PlayerListUploader';


interface Player {
  id: string;
  name: string;
  level: number;
  vest: boolean;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

function App() {
  const [teamAverageLevels, setTeamAverageLevels] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [rawList, setRawList] = useState<string>('');
  const [attendingRaw, setAttendingRaw] = useState<string>('');
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(6);
  const [distribution, setDistribution] = useState<'even' | 'grouped'>('even');
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [enableVests, setEnableVests] = useState<boolean>(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [savedTeamLists, setSavedTeamLists] = useState<{ id: string; name: string }[]>([]);
  const [playerListName, setPlayerListName] = useState<string>('Uten navn');
  const [availablePlayerLists, setAvailablePlayerLists] = useState<{ id: string; name: string }[]>([]);
  const [activePlayerListId, setActivePlayerListId] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  // Track the initial levels for each line in rawList
  const [initialLevels, setInitialLevels] = useState<number[]>([]);
  const [teamsGenerated, setTeamsGenerated] = useState<boolean>(false);
  // Track edited player levels for saving
  const [editedPlayers, setEditedPlayers] = useState<{ name: string, level: number }[]>([]);
  // For debounce autosave timer
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  const teamColors = ['blue', 'red', 'green', 'yellow', 'purple', 'pink'];
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100',
    red: 'bg-red-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    pink: 'bg-pink-100'
  };
  // Shuffle array utility
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  // Norwegian color names for team naming
  const fargeNavnMap: Record<string, string> = {
    blue: 'Blå',
    red: 'Rød',
    green: 'Grønn',
    yellow: 'Gul',
    purple: 'Lilla',
    pink: 'Rosa',
  };

  useEffect(() => {
    setUser({ id: 'dev-user-123', email: 'dummy@sportsdiff.dev' });
  }, []);

  // Hent playerList fra Supabase når user er satt
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('playerList').eq('id', user.id).single().then(res => {
        if (res.data?.playerList) setRawList(res.data.playerList);
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      supabase.from('player_lists')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(res => {
          if (res.data) setAvailablePlayerLists(res.data);
        });
    }
  }, [user]);

  // Lagre playerList eksplisitt
  useEffect(() => {
    if (user && rawList) {
      supabase.from('profiles').upsert({ id: user.id, playerList: rawList }, { onConflict: 'id' });
    }
  }, [rawList]);

  // Lagre attendingRaw som teamAttendance separat
  useEffect(() => {
    if (user && attendingRaw) {
      supabase.from('profiles').upsert({ id: user.id, teamAttendance: attendingRaw }, { onConflict: 'id' });
    }
  }, [attendingRaw]);

  // Hent teamAttendance når user er satt
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('teamAttendance').eq('id', user.id).single().then(res => {
        if (res.data?.teamAttendance) setAttendingRaw(res.data.teamAttendance);
      });
    }
  }, [user]);

  const parsePlayers = (text: string): Array<Player> =>
    text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const levelStr = parts.pop() ?? '0';
        const name = parts.join(' ');
        return {
          id: uuidv4(),
          name: name.trim(),
          level: parseFloat(levelStr.replace(',', '.')),
          vest: false,
          teamId: ''
        };
      });

  const assignVestsBalanced = (players: Player[]): Player[] => {
    const result: Player[] = [];

    Array.from(new Set(players.map(p => p.teamId))).forEach(teamId => {
      const teamPlayers = players.filter(p => p.teamId === teamId);
      const sorted = [...teamPlayers].sort((a, b) => b.level - a.level);

      const half = Math.ceil(sorted.length / 2);
      const groupA: Player[] = [];
      const groupB: Player[] = [];

      sorted.forEach((player, index) => {
        (index % 2 === 0 ? groupA : groupB).push(player);
      });

      const sumA = groupA.reduce((acc, p) => acc + p.level, 0);
      const sumB = groupB.reduce((acc, p) => acc + p.level, 0);

      const vestGroup = sumA > sumB ? groupB : groupA;

      result.push(...sorted.map(p => ({
        ...p,
        vest: vestGroup.includes(p),
      })));
    });

    return result;
  };

  const generateTeams = () => {
    console.log("🧪 Generating teams...");
    // Use basePlayers for accurate level mapping
    const basePlayers = parsePlayers(rawList);
    const attending = attendingRaw
      .split('\n')
      .map(name => name.trim())
      .filter(Boolean);
    console.log("Raw attending:", attending);
    console.log("Parsed base players:", basePlayers.map(p => `${p.name} (${p.level})`));

    // Map attending names to player objects from basePlayers, fallback to default if not found
    const filtered = attending.map(name => {
      const found = basePlayers.find(p => p.name.toLowerCase() === name.toLowerCase());
      return found ? { ...found, id: uuidv4() } : {
        id: uuidv4(),
        name,
        level: 1.0,
        vest: false,
        teamId: ''
      };
    });
    console.log("Filtered attending:", filtered.map(p => `${p.name} (${p.level})`));

    filtered.sort((a, b) => b.level - a.level);
    let newTeams: Team[] = [];
    let assigned: Player[] = [];

    if (distribution === 'even') {
      // Calculate the number of teams needed to fit all players with playersPerTeam per team
      const sorted = [...filtered].sort((a, b) => b.level - a.level);
      const numTeams = Math.ceil(filtered.length / playersPerTeam);

      newTeams = Array.from({ length: numTeams }, (_, i) => ({
        id: uuidv4(),
        name: `Lag ${i + 1} – ${fargeNavnMap[teamColors[i % teamColors.length]]}`,
        color: teamColors[i % teamColors.length],
      }));

      assigned = sorted.map((p, i) => ({
        ...p,
        teamId: newTeams[i % numTeams].id,
      }));
    } else {
      // Grouped distribution, as before
      const sorted = [...filtered].sort((a, b) => a.level - b.level); // 1 er best
      const numTeams = Math.ceil(filtered.length / playersPerTeam);
      newTeams = Array.from({ length: numTeams }, (_, i) => ({
        id: uuidv4(),
        name: `Lag ${i + 1} – ${fargeNavnMap[teamColors[i % teamColors.length]]}`,
        color: teamColors[i % teamColors.length],
      }));
      const assignedGrouped: Player[] = [];
      const maxPerTeam = playersPerTeam;
      const totalTeams = newTeams.length;

      let teamCounts = new Array(totalTeams).fill(0);
      let teamIndex = 0;

      for (const player of sorted) {
        while (teamCounts[teamIndex] >= maxPerTeam && teamIndex < totalTeams - 1) {
          teamIndex++;
        }
        assignedGrouped.push({
          ...player,
          teamId: newTeams[teamIndex].id,
        });
        teamCounts[teamIndex]++;
      }
      assigned = assignedGrouped;
    }
    console.log("Assigned players:", assigned.map(p => `${p.name} -> ${p.teamId}`));

    setTeams(newTeams);

    // Move vest assignment and average calc to after setPlayers
    const updatedPlayers = enableVests ? assignVestsBalanced(assigned) : assigned;
    setPlayers([...updatedPlayers]);

    // Calculate team averages immediately after setPlayers using updatedPlayers and newTeams
    const teamAverages = newTeams.map(team => {
      const teamPlayers = updatedPlayers.filter(p => p.teamId === team.id);
      const avg = teamPlayers.length > 0
        ? (teamPlayers.reduce((sum, p) => sum + p.level, 0) / teamPlayers.length).toFixed(2)
        : '0.00';
      return `${team.name}: ${avg}`;
    });
    setTeamAverageLevels(teamAverages);

    setTeamsGenerated(true);
  };

  const importToPlayers = async () => {
    if (!user || !rawList) return;

    const listId = uuidv4();

    const parsed = rawList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const levelStr = parts.pop() ?? '0';
        const name = parts.join(' ');
        return {
          id: `${listId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
          user_id: user.id,
          name: name.trim(),
          level: parseFloat(levelStr.replace(',', '.')),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          player_list_id: listId,
        };
      });

    // Ensure player_list_id is set correctly on all player objects
    const parsedWithListId = parsed.map(player => ({
      ...player,
      player_list_id: listId,
      id: `${listId}-${player.name.toLowerCase().replace(/\s+/g, '-')}`,
    }));

    // Logging Supabase response for players upsert
    const { error: insertPlayersError } = await supabase
      .from('players')
      .upsert(parsedWithListId, { onConflict: 'id' });

    if (insertPlayersError) {
      console.error('Feil ved spillerimport:', insertPlayersError);
    } else {
      console.log('Spillerimport OK', parsedWithListId);
    }

    const { error: insertListError } = await supabase.from('player_lists').insert({
      id: listId,
      user_id: user.id,
      name: playerListName,
      created_at: new Date().toISOString(),
    });

    if (insertPlayersError || insertListError) {
      console.error('Feil ved import:', insertPlayersError || insertListError);
    } else {
      alert('Spillerliste lagret og importert.');
      setActivePlayerListId(listId);
    }
  };

  useEffect(() => {
    if (rawList && attendingRaw) generateTeams();
  }, [rawList, attendingRaw, playersPerTeam, distribution, enableVests, activePlayerListId]);

  // Track initial levels at load or when rawList is loaded from saved lists
  useEffect(() => {
    // Parse the levels from the current rawList
    const levels = rawList
      .split('\n')
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const levelStr = parts.pop();
        if (!levelStr) return 0;
        const parsed = parseFloat(levelStr.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
      });
    setInitialLevels(levels);
    // Reset editedPlayers when loading a new list
    setEditedPlayers([]);
    // eslint-disable-next-line
  }, [/* Only trigger when rawList is updated from saved list, not on every keystroke */
      // We want to trigger this when a new list is loaded, not every edit.
      // So, track activePlayerListId or when user data is loaded.
      activePlayerListId, user]);

  const handleDragStart = (event: DragStartEvent) => {
    const dragged = players.find(p => p.id === event.active.id);
    setActivePlayer(dragged || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over?.id) {
      const draggedPlayer = players.find(p => p.id === active.id);
      if (!draggedPlayer) return;
      // Ensure over.id is a team id, not a player id
      const overIsTeam = teams.some(team => team.id === over.id);
      if (!overIsTeam) {
        setActivePlayer(null);
        return;
      }
      const updatedPlayers = players.map(p =>
        p.id === active.id ? { ...p, teamId: over.id as string } : p
      );
      const finalPlayers = enableVests ? assignVestsBalanced(updatedPlayers) : updatedPlayers;
      setPlayers(finalPlayers);
    }
    setActivePlayer(null);
  };

  // Save updated player levels to the database
  const saveUpdatedPlayerLevels = async () => {
    if (!user || !activePlayerListId || editedPlayers.length === 0) return;
    const updates = editedPlayers.map(p => ({
      name: p.name,
      level: p.level,
      user_id: user.id,
      player_list_id: activePlayerListId,
      updated_at: new Date().toISOString()
    }));
    await supabase.from('players').upsert(updates, {
      onConflict: 'user_id,player_list_id,name'
    });
    setEditedPlayers([]);
  };

  // Debounced autosave: save after 10s of inactivity after an edit
  useEffect(() => {
    if (editedPlayers.length === 0) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveUpdatedPlayerLevels();
    }, 10000); // 10 seconds
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line
  }, [editedPlayers]);

  // Reset button for player levels (revert to initialLevels)
  const resetPlayerLevels = () => {
    const lines = rawList.split('\n');
    const resetLines = lines.map((line, idx) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 0) return '';
      const name = parts.slice(0, -1).join(' ');
      return `${name} ${typeof initialLevels[idx] !== 'undefined' ? initialLevels[idx] : ''}`.trim();
    });
    setRawList(resetLines.join('\n'));
    setEditedPlayers([]);
  };

  return (
    <PremiumAccess user={user}>
      <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className="min-h-screen bg-gray-100 py-10 px-4 max-w-6xl mx-auto space-y-8 font-sans">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">📝 Lim inn spillerliste</h2>
          {availablePlayerLists.length > 0 && (
            <select
              className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2"
              onChange={async e => {
                const id = e.target.value;
                setActivePlayerListId(id);

                if (!id) {
                  setRawList('');
                  return;
                }

                const { data, error } = await supabase
                  .from('players')
                  .select('name, level')
                  .eq('player_list_id', id);

                if (data && data.length > 0) {
                  const formatted = data.map(p => `${p.name} ${p.level}`).join('\n');
                  setRawList(formatted);
                } else {
                  setRawList('');
                  alert('Ingen spillere funnet for denne listen.');
                }
              }}
            >
              <option value="">Hent tidligere liste…</option>
              {availablePlayerLists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
          )}
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
            rows={6}
            value={rawList}
            onChange={e => setRawList(e.target.value)}
            placeholder="Navn og nivå, f.eks. Ola Nordmann 3.2"
          />
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2"
            value={playerListName}
            onChange={e => setPlayerListName(e.target.value)}
            placeholder="Navn på spillerlisten"
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm mt-2"
            onClick={importToPlayers}
          >
            Importer til Players
          </button>
          {/* Always show editable player input grid and buttons */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {rawList.split('\n').map((line, index) => {
              // Split using the same logic as parsePlayers
              const parts = line.trim().split(/\s+/);
              const level = parts.pop();
              const name = parts.join(' ');
              // Determine initial level for this row
              const initialLevel =
                typeof initialLevels[index] !== 'undefined'
                  ? initialLevels[index]
                  : undefined;
              // Parse current level as number
              let currentLevelNum: number | undefined = undefined;
              if (typeof level !== 'undefined' && level !== '') {
                const parsed = parseFloat(level.replace(',', '.'));
                currentLevelNum = isNaN(parsed) ? undefined : parsed;
              }
              // Determine indicator
              let indicator = null;
              if (
                typeof currentLevelNum === 'number' &&
                typeof initialLevel === 'number' &&
                !isNaN(currentLevelNum) &&
                !isNaN(initialLevel) &&
                initialLevel !== undefined &&
                currentLevelNum !== initialLevel
              ) {
                if (currentLevelNum < initialLevel) {
                  // Lower than initial: green upward triangle
                  indicator = (
                    <span className="ml-1 text-green-500" title="Nedjustert nivå">
                      ▲
                    </span>
                  );
                } else if (currentLevelNum > initialLevel) {
                  // Higher than initial: red downward triangle
                  indicator = (
                    <span className="ml-1 text-red-500" title="Oppjustert nivå">
                      ▼
                    </span>
                  );
                }
              }
              return (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg p-2 text-sm flex-1"
                    value={name || ''}
                    onChange={e => {
                      const newLines = [...rawList.split('\n')];
                      newLines[index] = `${e.target.value}\t${level || ''}`;
                      setRawList(newLines.join('\n'));
                    }}
                    placeholder="Navn"
                  />
                  <div className="flex items-center">
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg p-2 text-sm w-20"
                      value={level || ''}
                      onChange={e => {
                        const newLines = [...rawList.split('\n')];
                        // Update the line with the new level
                        newLines[index] = `${name || ''}\t${e.target.value}`;
                        setRawList(newLines.join('\n'));
                        // Track edits for saving
                        // Only update if activePlayerListId is set and both name and level are present
                        if (activePlayerListId && (name || '').trim() && e.target.value.trim()) {
                          const updatedLevel = parseFloat(e.target.value.replace(',', '.'));
                          if (!isNaN(updatedLevel)) {
                            setEditedPlayers(prev => {
                              // If already exists, update, else add
                              const idx = prev.findIndex(p => p.name === name.trim());
                              if (idx !== -1) {
                                const updated = [...prev];
                                updated[idx] = { name: name.trim(), level: updatedLevel };
                                return updated;
                              }
                              return [...prev, { name: name.trim(), level: updatedLevel }];
                            });
                          }
                        }
                      }}
                      placeholder="Nivå"
                    />
                    {indicator}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              onClick={saveUpdatedPlayerLevels}
              disabled={editedPlayers.length === 0}
            >
              Lagre endringer
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 text-sm"
              onClick={resetPlayerLevels}
              type="button"
            >
              Tilbakestill nivåer
            </button>
          </div>
          <Link to="/rediger-spillerliste" className="text-sm text-blue-600 hover:underline">Rediger lagliste</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6 space-y-4 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🟢 Spillere som kommer</h2>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={attendingRaw}
            onChange={e => setAttendingRaw(e.target.value)}
            placeholder="Lim inn navn på spillere som kommer på trening/kamp"
          />
          <p className="text-sm text-gray-500 mt-1">
            Antall spillere: {attendingRaw.split('\n').filter(name => name.trim()).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 space-y-4 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">⚙️ Laginnstillinger</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spillere per lag</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                value={playersPerTeam}
                onChange={e => setPlayersPerTeam(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fordeling</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                value={distribution}
                onChange={e => setDistribution(e.target.value as 'even' | 'grouped')}
              >
                <option value="even">Jevn fordeling</option>
                <option value="grouped">Differensierte lag</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={enableVests}
                onChange={() => setEnableVests(!enableVests)}
              />
              <label className="text-sm text-gray-700">Fordel vester</label>
            </div>
          </div>
          <TeamManager
            user={user}
            players={players}
            setPlayers={setPlayers}
            teams={teams}
          />
          {teamAverageLevels.length > 0 && (
            <div className="mt-4 text-sm text-gray-700">
              <strong>Snittnivå per lag:</strong>
              <ul className="list-disc list-inside">
                {teamAverageLevels.map((avg, idx) => (
                  <li key={idx}>{avg}</li>
                ))}
              </ul>
            </div>
          )}
          {teamsGenerated && (
            <button
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
              onClick={() => {
                setPlayers([]);
                setTeams([]);
                setTeamsGenerated(false);
              }}
            >
              Tilbakestill spillerliste
            </button>
          )}
        </div>
      </div>
      <DragOverlay>
        {activePlayer ? (
          <div className="p-2 bg-white border border-gray-300 rounded shadow text-sm">
            {activePlayer.name} ({activePlayer.level})
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>
    </PremiumAccess>
  );
}

export default App;