import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export function AuthView() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
      <div className="bg-white rounded shadow p-6 max-w-md w-full">
        <h1 className="text-xl font-bold mb-4 text-center">Logg inn til Sportsdiff</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
        />
      </div>
    </div>
  );
}
