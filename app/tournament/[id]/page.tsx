"use client"

import { useEffect, useState } from "react";
import Initialization from "./initialization"
import { ViewTournament } from "@/components/tournamentViews/viewTournament";
import Join from "./join"
import { useParams, useSearchParams } from "next/navigation";
import { Tournament } from "@/types/tournamentTypes";
import { SpinningLoader } from "@/components/loading";
import { createClient } from "@/utils/supabase/client";
import { useMessage } from "@/context/messageContext";

export default function Home() {
    const searchParams = useSearchParams();
    const hasJoinParam = searchParams.has("join");
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
    }, [supabase, id, triggerMessage])

    return (
        <div className="relative">
            <button
                className="absolute top-4 right-4 px-6 py-3 text-lg font-semibold rounded-lg transition-all transform bg-background text-gray-400 hover:bg-highlight hover:text-white shadow-md z-50 pointer-events-auto"
                onClick={() => console.log("hello")}
            >
                Generate Scores
            </button>

            {hasJoinParam ? (
                <Join />
            ) : (
                <div>
                    {tournament ? (
                        <div>
                            {tournament.status == "initialization" && (
                                <Initialization />
                            )}

                            {tournament.status == "started" && (
                                <ViewTournament tournamentID={Number(id)} />
                            )}
                        </div>
                    ) : (
                        <SpinningLoader />
                    )}
                </div>
            )}
        </div>
    )
}