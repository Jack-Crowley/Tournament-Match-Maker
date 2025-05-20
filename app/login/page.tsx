"use client"

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpinningLoader } from '@/components/loading';
import Link from 'next/link';

const LoginPageContent = () => {
  const supabase = createClient();
  const [captchaValue, setCaptchaValue] = useState(null);
  const [wind, setWindow] = useState<Window | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectParam = searchParams?.get('redirectTo');
  
  useEffect(() => {
    setWindow(window);
  }, []);

  const handleAnonymousSignIn = async () => {
    if (!captchaValue) {
      alert('Please complete the CAPTCHA.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('Error signing in anonymously:', error.message);
        return;
      }
      
      if (data.session) {
        const redirectTo = redirectParam || localStorage.getItem('previousPath') || '/';
        localStorage.removeItem('previousPath');
        router.push(redirectTo);
      }
    } catch (err) {
      console.error('Unexpected error during anonymous sign-in:', err);
    }
  }; 

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/" className="flex items-center">
          <span className="text-white font-bold text-2xl">TMM</span>
        </Link>
      </div>
    <div className="w-full min-h-screen flex justify-center items-center bg-gradient-to-b from-[#160A3A] to-[#2A1A5E] p-4">
      {wind ? (
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome</h1>
            <p className="text-purple-200 text-lg">Sign in to continue to your account</p>
          </div>
          
          <div className="bg-[#ffffff10] backdrop-blur-md rounded-2xl shadow-xl border border-white/10 overflow-hidden">
            {/* Sign in options container */}
            <div className="p-8">
              <h2 className="text-xl font-medium text-white mb-6 text-center">Choose how to sign in</h2>
              
              {/* Google Auth Button - Custom Styled */}
              <div className="mb-6">
                <button 
                  onClick={() => {
                    supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback`
                      }
                    });
                  }}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center group"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
              
              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-grow h-px bg-purple-300/20"></div>
                <span className="px-4 text-sm text-purple-200/80">OR</span>
                <div className="flex-grow h-px bg-purple-300/20"></div>
              </div>
              
              {/* Anonymous Auth */}
              <div>
                <h3 className="text-lg font-medium text-white mb-5 text-center">Continue anonymously</h3>
                
                <div className="flex justify-center mb-6">
                  <ReCAPTCHA
                    sitekey="6Le28dEqAAAAAFVOagbpX_03RZcwRyCGWUQllp0R"
                    onChange={(value : any) => setCaptchaValue(value)}
                    theme="dark"
                  />
                </div>
                
                <button
                  onClick={handleAnonymousSignIn}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-all duration-200 font-medium flex items-center justify-center shadow-md hover:shadow-indigo-700/30"
                >
                  <span>Sign In Anonymously</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-purple-200/80 text-sm">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      ) : (
        <SpinningLoader />
      )}
      
      <style jsx global>{`
        .supabase-auth-ui_ui-anchor {
          color: #c5b8ff !important;
          font-size: 14px;
          text-decoration: none !important;
        }
        .supabase-auth-ui_ui-anchor:hover {
          color: #ffffff !important;
          text-decoration: underline !important;
        }
        .supabase-auth-ui_ui-button {
          background-color: #4F46E5 !important;
          transition: all 0.2s ease;
        }
        .supabase-auth-ui_ui-button:hover {
          background-color: #4338CA !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .supabase-auth-ui_ui-button-social {
          border: none !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .supabase-auth-ui_ui-button-social:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
        .supabase-auth-ui_ui-divider {
          display: none;
        }
        .supabase-auth-ui_ui-container {
          width: 100% !important;
        }
        .supabase-auth-ui_ui-label {
          color: white;
        }
      `}</style>
    </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={<SpinningLoader />}>
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;