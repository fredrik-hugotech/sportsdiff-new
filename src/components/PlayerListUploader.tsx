import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Player {
  name: string;
  level: number;
  position: string;
}

interface PlayerListUploaderProps {
  userId: string;
}

export default function PlayerListUploader({ userId }: PlayerListUploaderProps) {
  const [rawInput, setRawInput] = useState('');
  const [teamName, setTeamName] = useState('');
  const [saving, setSaving] = useState(false);
  const [playerLists, setPlayerLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState('');

  useEffect(() => {
    supabase
      .from('player_lists')
      .select('id, name')
      .eq('user_id', userId)
      .then(({ data }) => setPlayerLists(data ?? []));
  }, []);

  const parsePlayers = (text: string): Player[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        const [name, levelStr] = line.split(/\t| {2,}/);
        return {
          name: name?.trim(),
          level: parseFloat(levelStr?.replace(',', '.') ?? '0'),
          position: '',
        };
      });
  };

  const handleSave = async () => {
    if (!teamName.trim() || !rawInput.trim()) return;

    const players = parsePlayers(rawInput);
    if (!players.length) return;

    setSaving(true);

    const { data: listData, error: listError } = await supabase
      .from('player_lists')
      .insert([{ name: teamName.trim(), user_id: userId }])
      .select();

    if (listError || !listData?.[0]) {
      console.error('Feil ved lagring av liste:', listError);
      setSaving(false);
      return;
    }

    const player_list_id = listData[0].id;

    const playerRows = players.map(p => ({
      ...p,
      user_id: userId,
      player_list_id,
    }));

    const { error: playersError } = await supabase
      .from('players')
      .insert(playerRows);

    if (playersError) {
      console.error('Feil ved lagring av spillere:', playersError);
    } else {
      console.log('✅ Lagret liste og spillere!');
      setRawInput('');
      setTeamName('');
    }

    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        📝 Lag ny lagliste
      </h2>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">🔄 Hent eksisterende lagliste</label>
        <select
          value={selectedListId}
          onChange={e => {
            const id = e.target.value;
            setSelectedListId(id);
            const list = playerLists.find(l => l.id === id);
            if (list) {
              setTeamName(list.name);
              supabase
                .from('players')
                .select('*')
                .eq('player_list_id', id)
                .eq('user_id', userId)
                .then(({ data }) => {
                  if (data) {
                    const formatted = data.map(p => `${p.name}\t${p.level}`).join('\n');
                    setRawInput(formatted);
                  }
                });
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
        >
          <option value="">Velg en lagliste...</option>
          {playerLists.map(list => (
            <option key={list.id} value={list.id}>{list.name}</option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={teamName}
        onChange={e => setTeamName(e.target.value)}
        placeholder="Navn på lagliste"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <textarea
        value={rawInput}
        onChange={e => setRawInput(e.target.value)}
        placeholder={`Ola Nordmann\t3.2\nKari Langbein\t2.8`}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Lagrer...' : '💾 Lagre lagliste'}
      </button>
    </div>
  );
}