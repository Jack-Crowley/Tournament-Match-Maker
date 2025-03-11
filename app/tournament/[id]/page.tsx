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
import { getPermissionLevelForTournament } from "@/utils/auth/getPermissionLevel";
import { useClient } from "@/context/clientContext";

export default function Home() {
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const params = useParams();
    const client = useClient();
    const id = params.id;

    const supabase = createClient();
    const { triggerMessage } = useMessage();

    useEffect(() => {
        async function loadTournament() {
            const { data, error } = await supabase
                .from("tournaments")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                triggerMessage("Error fetching tournament", "red");
                return;
            }

            setTournament(data);
        }

        loadTournament();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase, id]);

    useEffect(() => {
        async function loadPlayerPermission() {
            const userObj = await getPermissionLevelForTournament(Number(id), client);
            setUser(userObj);
            console.log(userObj);
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
                        <SpinningLoader />
                    </div>
                )}
            </div>
        </div>
    );
}
