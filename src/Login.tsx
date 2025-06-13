import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient'; // sørg for at du har en eksportert supabase-klient

export default function Login() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
      <div className="bg-white rounded shadow p-6 max-w-md w-full">
        <h1 className="text-xl font-bold mb-4 text-center">Logg inn til Sportsdiff</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="default"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-post',
                password_label: 'Passord',
                button_label: 'Logg inn'
              },
              sign_up: {
                email_label: 'E-post',
                password_label: 'Passord',
                button_label: 'Opprett konto'
              }
            }
          }}
        />
      </div>
    </div>
  );
}