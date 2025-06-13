import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ListSelector from './ListSelector';

interface Player {
  id: string;
  name: string;
  position: string;
  level: number;
}

export default function ListSelectorPage() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  // Hent bruker-ID dynamisk fra Supabase, fallback til dev-user-123 for testing
  const user = supabase.auth.getUser();
  const userId = user?.data?.user?.id ?? 'dev-user-123';

  // 🔁 Hent spillere når en liste er valgt
  useEffect(() => {
    if (!selectedListId) return;

    supabase
      .from('players')
      .select('*')
      .eq('player_list_id', selectedListId)
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) console.error('Feil ved henting av spillere:', error.message);
        else setPlayers(data || []);
      });
  }, [selectedListId]);

  // ➕ Opprett ny spillerliste
  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    const { data, error } = await supabase
      .from('player_lists')
      .insert([{ name: newListName.trim(), user_id: userId }])
      .select();

    if (error) {
      console.error('Feil ved oppretting av ny liste:', error.message);
    } else if (data && data[0]) {
      setSelectedListId(data[0].id); // Velg ny liste
      setNewListName('');
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Rediger spillerliste</h1>

      <ListSelector
        userId={userId}
        selectedId={selectedListId}
        onSelect={setSelectedListId}
      />

      {/* ➕ Opprett ny liste */}
      {creating ? (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            placeholder="Navn på ny liste"
            className="border p-2 rounded w-64"
          />
          <button
            onClick={handleCreateList}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Lagre
          </button>
          <button
            onClick={() => {
              setCreating(false);
              setNewListName('');
            }}
            className="text-sm text-gray-600"
          >
            Avbryt
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mb-4 text-sm text-blue-600 underline"
        >
          ➕ Opprett ny liste
        </button>
      )}

      {/* Spillervisning */}
      {players.length === 0 ? (
        <p className="text-gray-500">Ingen spillere funnet.</p>
      ) : (
        <ul className="space-y-2">
          {players.map(p => (
            <li key={p.id} className="border p-2 rounded">
              {p.name} – {p.position} – nivå {p.level}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}