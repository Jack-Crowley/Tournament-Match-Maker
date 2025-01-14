"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client'
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { faFileShield } from '@fortawesome/free-solid-svg-icons';

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

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data: { session } } = await client.auth.getSession();
                setSession(session);

                if (!session) {
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

        client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                console.log(event)
            }
            if (session && !signedIn) {
                setSignedIn(true)
                router.push('/account');
            }
        });
    }, [client, router]);

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