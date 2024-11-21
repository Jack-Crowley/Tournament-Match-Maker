"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client'
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type ClientContextType = {
    client: SupabaseClient;
    session: Session | null;
    authChange: number;
    setAuthChange: any;
};

const ClientContext = createContext<ClientContextType | null>(null);

export function AuthenticationProvider({ children }: { children: ReactNode }) {
    const [client] = useState<SupabaseClient>(createClient());
    const [session, setSession] = useState<Session | null>(null);
    const [authChange, SetAuthChange] = useState<number>(0)
    const [admin, setAdmin] = useState<boolean>(false)
    const router = useRouter();

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data: { session } } = await client.auth.getSession();
                setSession(session);

                if (!session) {
                    router.push('/login');
                    return;
                }
            } catch (err) {
                router.push('/login');
            }
        };

        fetchSession();

        client.auth.onAuthStateChange((event, session) => {
            fetchSession();
            SetAuthChange(authChange + 1)
            if (event === 'SIGNED_OUT') {
                router.push('/login');
            }
        });
    }, [client, router]);

    const value: ClientContextType = {
        client,
        session,
        authChange,
        setAuthChange: SetAuthChange
    };

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    );
}

export function useAuthentication(): ClientContextType {
    const context = useContext(ClientContext);
    if (context === null) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
}