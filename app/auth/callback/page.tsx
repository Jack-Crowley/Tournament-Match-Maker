"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { SpinningLoader } from "@/components/loading";

export default function AuthCallback() {
    const supabase = createClient()
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
                router.push("/tournaments");
            } else {
                router.push("/");
            }
        }
        checkAuth();
    }, [router, supabase.auth]);

    return (
        <SpinningLoader text="Processing Login..."/>
    );
}