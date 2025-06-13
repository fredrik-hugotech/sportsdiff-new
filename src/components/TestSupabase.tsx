import React from 'react';
import { supabase } from '../supabaseClient';

export default function TestSupabase() {
  const userId = 'dev-user-123';

  const handleInsert = async () => {
    const { data, error } = await supabase
      .from('player_lists')
      .insert([{ name: 'Testliste fra UI', user_id: userId }])
      .select();

    if (error) {
      console.error('❌ INSERT-feil:', error.message, error);
    } else {
      console.log('✅ INSERT ok:', data);
    }
  };

  const handleSelect = async () => {
    const { data, error } = await supabase
      .from('player_lists')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ SELECT-feil:', error.message, error);
    } else {
      console.log('✅ SELECT-data:', data);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">🧪 Supabase Test</h2>
      <button
        onClick={handleInsert}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        ➕ Lag testliste
      </button>
      <button
        onClick={handleSelect}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        🔍 Hent alle lister
      </button>
    </div>
  );
}