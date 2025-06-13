import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export async function getTeamsWithPlayers(userId: string) {
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', userId);

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', userId);

  return {
    players: players ?? [],
    teams: teams ?? []
  };
}

interface PlayerInput {
  id: string;
  name: string;
  level: number;
  teamId: string;
  vest: boolean;
  categories?: Record<string, number>;
  development?: Record<string, number>;
}

export async function savePlayerList(userId: string, players: PlayerInput[]) {
  const cleaned = players.map(p => ({
    ...p,
    user_id: userId,
    categories: p.categories ?? {},
    development: p.development ?? {}
  }));
  await supabase.from('players').upsert(cleaned, { onConflict: 'id' });
}
