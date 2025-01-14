"use client"

import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client'

const LoginPage = () => {
  const supabase = createClient()

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[#160A3A]">
      <div className="w-full max-w-md p-8 bg-[#604BAC] rounded-lg shadow-lg">
        <h1 className="text-4xl font-extrabold text-center text-[#fbfe9d] mb-6">Log in</h1>

        <Auth
          supabaseClient={supabase}
          providers={["google"]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#7e67d2',
                  brandAccent: '#604BAC',
                  inputText: 'black',
                  inputPlaceholder: '#888888',
                  inputBorder: '#604BAC',
                  inputBackground: 'white',
                },
              },
            },
          }}
          theme="dark"
        />
      </div>
    </div>
  );
};

export default LoginPage;
