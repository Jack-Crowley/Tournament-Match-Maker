"use client"

import { useEffect, useState } from "react";
import Initialization from "./initialization"
import { ViewTournament } from "@/components/tournamentViews/viewTournament";
import { useParams } from "next/navigation";
import { Tournament } from "@/types/tournamentTypes";
import { SpinningLoader } from "@/components/loading";
import { createClient } from "@/utils/supabase/client";
import { useMessage } from "@/context/messageContext";

export default function Home() {
    const [tournament, setTournament] = useState<Tournament | null>(null)
    const params = useParams();
    const id = params.id;

    const supabase = createClient()
    const { triggerMessage } = useMessage()

    useEffect(() => {
        async function loadTournament() {
            const { data, error } = await supabase.from("tournaments").select("*").eq("id", id).single()

            if (error) {
                triggerMessage("Error fetching tournament", "red")
                return
            }

            setTournament(data)
        }

        loadTournament()
    }, [supabase, id])

    async function refreshTournament() {
        const { data, error } = await supabase.from("tournaments").select("*").eq("id", id).single()

        if (error) {
            triggerMessage("Error reloading tournament", "red")
            return
        }

        setTournament(data)
    }

    return (
        <div className="relative">
            <div>
                {tournament ? (
                    <div>
                        {tournament.status == "initialization" && (
                            <Initialization refreshTournament={refreshTournament}/>
                        )}

                        {tournament.status == "started" && (
                            <ViewTournament tournamentID={Number(id)} />
                        )}
                    </div>
                ) : (
                    <SpinningLoader />
                )}
            </div>
        </div>
    )
}