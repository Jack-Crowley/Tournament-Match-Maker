"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client'
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { faFileShield } from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';

type ClientContextType = {
    client: SupabaseClient;
    session: Session | null;
    authChange: number;
    setAuthChange: any;
    admin: boolean;
};

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
    const [client] = useState<SupabaseClient>(createClient());
    const [session, setSession] = useState<Session | null>(null);
    const [signedIn, setSignedIn] = useState<boolean>(false)
    const [authChange, SetAuthChange] = useState<number>(0)
    const [admin, setAdmin] = useState<boolean>(false)
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data: { session } } = await client.auth.getSession();
                setSession(session);

                if (!session) {
                    // Store current path before redirecting to login
                    if (pathname !== '/login' && pathname !== '/auth/callback') {
                        localStorage.setItem('previousPath', pathname);
                    }
                    router.push('/login');
                    return;
                }

                setSignedIn(true);

            } catch (err) {
                console.log(err)
                // router.push('/login');
            }
        };

        fetchSession();

        // Set up auth state change listener
        const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event);
            
            if (event === 'SIGNED_OUT') {
                setSignedIn(false);
                setSession(null);
                
                // For sign out, we still want to redirect to login
                router.push('/login');
            } 
            else if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
                // Just update the session state - no automatic redirects
                setSession(session);
                setSignedIn(true);
                
                // Trigger auth change for components that need to react
                SetAuthChange(prev => prev + 1);
            }
        });

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, [client, router, pathname]);

    const value: ClientContextType = {
        client,
        session,
        authChange,
        admin,
        setAuthChange: SetAuthChange
    };

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    );
}

export function useClient(): ClientContextType {
    const context = useContext(ClientContext);
    if (context === null) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
}