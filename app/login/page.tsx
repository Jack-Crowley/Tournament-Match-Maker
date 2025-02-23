"use client"

import { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRouter } from 'next/navigation';
import { SpinningLoader } from '@/components/loading';

const LoginPage = () => {
  const supabase = createClient();
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [wind, setWindow] = useState<null | any>(null)

  const router = useRouter();

  useEffect(() => {
    setWindow(window)
  }, [])

  const handleAnonymousSignIn = async () => {
    if (!captchaValue) {
      alert('Please complete the CAPTCHA.');
      return;
    }

    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Error signing in anonymously:', error.message);
    } else {
      router.push("/")
      console.log('Signed in anonymously');
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-[#160A3A] p-4">
      {wind ? (
        <div>
          <div className="w-full max-w-4xl p-8 bg-[#604BAC] rounded-lg shadow-lg flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 md:pr-4 mb-8 md:mb-0">
              <h1 className="text-3xl font-extrabold text-center text-[#ffffff] mb-6">Log in</h1>

              <Auth
                supabaseClient={supabase}
                providers={["google"]}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#31216b',
                        brandAccent: '#392875',
                        inputText: 'black',
                        inputPlaceholder: '#888888',
                        inputBorder: '#31216b',
                        inputBackground: 'white',
                      },
                    },
                  },
                }}
                theme="dark"
                redirectTo={`${window.location.origin}/auth/callback`}
              />
            </div>

            <div className="w-full md:w-1/2 md:pl-4 md:border-l md:border-[#31216b] mt-6 md:mt-0">
              <h1 className="text-3xl font-extrabold text-center text-[#ffffff] mb-6">Or Sign In Anonymously</h1>

              <div className="mt-6 flex justify-center">
                <ReCAPTCHA
                  sitekey="6Le28dEqAAAAAFVOagbpX_03RZcwRyCGWUQllp0R"
                  onChange={(value: any) => setCaptchaValue(value)}
                />
              </div>

              <button
                onClick={handleAnonymousSignIn}
                className="w-full mt-4 p-2 bg-[#31216b] text-white rounded-lg hover:bg-[#392875] transition-colors"
              >
                Sign In Anonymously
              </button>
            </div>
          </div>

          <style>
            {`
      .supabase-auth-ui_ui-anchor {
        color: #ffffff !important; /* Change to your desired color */
        font-size: 14px;
      }
      .supabase-auth-ui_ui-anchor:hover {
        color: #dedede !important; /* Change to your desired hover color */
      }

      .supabase-auth-ui_ui-label {
      color: white;}
    `}
          </style>
        </div>
      ) : (
        <SpinningLoader />
      )}
    </div>
  )
}


export default LoginPage;