"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { SupabaseClient, Session } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

type ClientContextType = {
    client: SupabaseClient;
    session: Session | null;
    authChange: number;
    setAuthChange: React.Dispatch<React.SetStateAction<number>>;
    admin: boolean;
};

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
    const [client] = useState<SupabaseClient>(createClient());
    const [session, setSession] = useState<Session | null>(null);
    const [authChange, setAuthChange] = useState<number>(0);
    const [admin, setAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchSession = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await client.auth.getSession();
                setSession(session);

                if (!session && pathname !== "/login" && pathname !== "/auth/callback" && pathname !== "/") {
                    localStorage.setItem("previousPath", pathname);
                    router.push("/login");
                }
            } catch (err) {
                console.error("Error fetching session:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();

        const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event);

            if (event === "SIGNED_OUT") {
                setSession(null);
                router.push("/login");
            } else if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
                setSession(session);
                setAuthChange(prev => prev + 1);
            }
        });

        return () => subscription?.unsubscribe();
    }, [client, router, pathname]);

    if (loading) return <p>Loading...</p>;

    return (
        <ClientContext.Provider value={{ client, session, authChange, setAuthChange, admin }}>
            {children}
        </ClientContext.Provider>
    );
}

export function useClient(): ClientContextType {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error("useClient must be used within a ClientProvider");
    }
    return context;
}
