import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface PlayerProfile {
  id: string;
  user_id: string;
  name: string;
  level: number;
  speed: number;
  strength: number;
  technique: number;
  position: string;
}

export default function PlayerListEditor({ user }: { user: any }) {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [playerLists, setPlayerLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('player_lists')
      .select('id, name')
      .eq('user_id', user?.id ?? 'dev-user-123')
      .then(({ data }) => setPlayerLists(data ?? []));
  }, [user]);

  useEffect(() => {
    if (!user || !selectedListId) return;

    const loadPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user?.id ?? 'dev-user-123')
        .eq('player_list_id', selectedListId)
        .order('name');

      if (error) {
        console.error('Feil ved henting av spillere:', error.message);
      } else {
        setPlayers(data || []);
      }
    };

    loadPlayers();
  }, [user, selectedListId]);

  const updatePlayer = async (player: PlayerProfile, field: keyof PlayerProfile, value: any) => {
    const updatedPlayer = { ...player, [field]: value };
    setPlayers(prev =>
      prev ? prev.map(p => (p.id === player.id ? updatedPlayer : p)) : prev
    );

    const { error } = await supabase
      .from('players')
      .update(updatedPlayer)
      .eq('id', player.id);

    if (error) {
      console.error('Feil ved oppdatering:', error.message);
    }
  };

  if (players === null) {
    return (
      <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">📝 Rediger spillerliste</h2>
        <p className="text-gray-600 text-sm">Laster spillere...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">📝 Rediger spillerliste</h2>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">🎯 Velg lagliste</label>
        <select
          value={selectedListId}
          onChange={e => setSelectedListId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
        >
          <option value="">Velg en lagliste...</option>
          {playerLists.map(list => (
            <option key={list.id} value={list.id}>{list.name}</option>
          ))}
        </select>
      </div>
      {players.length === 0 ? (
        <p className="text-gray-600 text-sm italic">Ingen spillere funnet.</p>
      ) : (
        <table className="w-full text-sm text-left border border-gray-200 rounded overflow-hidden">
          <thead className="bg-gray-100 text-gray-700 uppercase">
            <tr>
              <th className="p-3 border">Navn</th>
              <th className="p-3 border">Nivå</th>
              <th className="p-3 border">Fart</th>
              <th className="p-3 border">Styrke</th>
              <th className="p-3 border">Teknikk</th>
              <th className="p-3 border">Posisjon</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="p-2 border font-medium">{player.name}</td>
                {['level', 'speed', 'strength', 'technique'].map(field => {
                  const value = player[field as keyof PlayerProfile] ?? '';
                  return (
                    <td key={field} className="p-2 border">
                      <input
                        type="number"
                        value={value}
                        onChange={e => {
                          const newValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          updatePlayer(player, field as keyof PlayerProfile, newValue);
                        }}
                        className="w-full border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  );
                })}
                <td className="p-2 border">
                  <input
                    type="text"
                    value={player.position || ''}
                    onChange={e => updatePlayer(player, 'position', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}