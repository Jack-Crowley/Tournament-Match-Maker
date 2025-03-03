"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { SpinningLoader } from '@/components/loading';

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in auth callback:', error.message);
          router.push('/login');
          return;
        }
        
        if (data.session) {
          const redirectTo = searchParams.get('redirectTo') || '/account';
          console.log("Auth callback redirecting to:", redirectTo);
          
          router.push(redirectTo);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        router.push('/login');
      }
    };
    
    handleAuthCallback();
  }, [router, searchParams, supabase.auth]);
  
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-[#160A3A]">
      <SpinningLoader />
      <p className="text-white mt-4">Finalizing authentication...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<SpinningLoader />}>
      <AuthCallbackPageContent />
    </Suspense>
  );
}
