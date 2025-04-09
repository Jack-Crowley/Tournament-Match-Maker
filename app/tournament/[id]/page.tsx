"use client";

import { useEffect, useState } from "react";
import Initialization from "./initialization";
import { ViewTournament } from "@/components/tournamentViews/viewTournament";
import { useParams } from "next/navigation";
import { Tournament } from "@/types/tournamentTypes";
import { SpinningLoader } from "@/components/loading";
import { createClient } from "@/utils/supabase/client";
import { useMessage } from "@/context/messageContext";
import { User } from "@/types/userType";
import { useClient } from "@/context/clientContext";
import Link from "next/link";

export default function Home() {
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const params = useParams();
    const client = useClient();
    const id = params.id;

    const supabase = createClient();
    const { triggerMessage } = useMessage();

    const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null)

    useEffect(() => {
        async function loadTournament() {
            const { data, error } = await supabase
                .from("tournaments")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                setUnavailableMessage("Unable to find tournament")
                return;
            }

            setTournament(data);
        }

        loadTournament();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase, id]);

    useEffect(() => {
        async function loadPlayerPermission() {
            const res = await fetch(`/api/tournament/permission_level?tournamentID=${id}`)

            if (!res.ok) {
                console.error('Failed to fetch permission level')
                return
            }

            const data = await res.json()
            setUser(data)
        }

        loadPlayerPermission();
    }, [client, id]);

    async function refreshTournament() {
        const { data, error } = await supabase
            .from("tournaments")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            triggerMessage("Error reloading tournament", "red");
            return;
        }

        setTournament(data);
    }

    return (
        <div className="relative">
            <div>
                {tournament && user ? (
                    <div>
                        {/* Show Initialization if tournament is still in setup phase */}
                        {tournament.status === "initialization" && (
                            <Initialization refreshTournament={refreshTournament} user={user} />
                        )}

                        {/* Show Tournament Bracket when started or completed */}
                        {(tournament.status === "started" || tournament.status === "completed") && (
                            <ViewTournament tournamentID={Number(id)} user={user} />
                        )}
                    </div>
                ) : (
                    <div>
                        {unavailableMessage ? (
                            <div className="w-full h-[90vh] flex items-center justify-center">
                                <div className="bg-[#2d2158] p-8 rounded-lg shadow-lg max-w-md w-full">
                                    <h2 className="text-red-400 font-bold text-2xl mb-6 text-center">{unavailableMessage}</h2>
                                    <Link href="/tournaments">
                                        <button className="w-full bg-[#7458da] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors">
                                            Back To Tournament Page
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <SpinningLoader />
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
