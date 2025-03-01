"use client"

import { useMessage } from "@/context/messageContext";
import { Player } from "@/types/playerTypes";
import { Tournament } from "@/types/tournamentTypes";
import { createClient } from "@/utils/supabase/client";
import { faList } from "@fortawesome/free-solid-svg-icons/faList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { supabase } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";

export const WaitlistView = ({ tournamentID }: { tournamentID: number }) => {
    const [activePlayer, setActivePlayer] = useState<Player | null>(null);
    const [players, setPlayers] = useState<Player[]>([])
    const [tournament, setTournament] = useState<Tournament | null>(null)

    const { triggerMessage } = useMessage()
    const supabase = createClient()

    useEffect(() => {
        async function loadPlayers() {
            const { data, error } = await supabase.from("tournament_players").select("*").eq("tournament_id", tournamentID).eq("type", "waitlist")

            if (error) {
                triggerMessage("Error fetching waitlist", "red")
            }
            else {
                setPlayers(data as Player[])
            }

            const { data: tourn, error: tournamentError } = await supabase.from("tournaments").select("*").eq("tournament_id", tournamentID).single()

            setTournament(tourn as Tournament)
        }

        loadPlayers()
    }, [])


    return (
        <div className="w-full max-w-6xl mx-auto bg-[#1F1346] p-12">
            <div className="relative px-6 pt-8 md:px-10">
                <div className="flex items-center justify-center mb-6">
                    <h1 className="text-[#7458da] font-bold text-3xl md:text-4xl text-center">
                        <FontAwesomeIcon icon={faList} className="mr-3" />
                        Waitlist
                    </h1>
                </div>
            </div>
            {players.length > 0 && (
                <div className={`mb-8 mt-12`}>
                    <div className="overflow-hidden rounded-lg shadow-2xl bg-[#2a1a66] p-8">

                        <table className="w-full rounded-lg border-collapse bg-[#1b113d]">
                            <thead>
                                <tr className="bg-[#1b113d]">
                                    <th className="p-4 text-left text-white font-semibold text-lg border-b-2 border-[#3a2b7d]">Name</th>
                                    {tournament?.skill_fields.map((skill, index) => (
                                        <th
                                            key={index}
                                            className="p-4 text-left text-white font-semibold text-lg border-b-2 border-[#3a2b7d] truncate max-w-[150px]"
                                        >
                                            {skill}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player, playerIndex) => (
                                    <tr
                                        key={player.id}
                                        onClick={() => setActivePlayer(activePlayer?.id === player.id ? null : player)}
                                        className={`
                                            ${playerIndex % 2 === 0 ? 'bg-[#211746]' : 'bg-[#281b5a]'}
                                            ${activePlayer?.id === player.id ? 'bg-[#342575]' : ''}
                                            hover:bg-[#3a2b7d] transition-colors duration-200 cursor-pointer
                                        `}
                                    >
                                        <td className={`p-4 text-lg border-b border-[#3a2b7d] ${player.is_anonymous ? "text-white font-medium" : "text-[#d8d8d8]"}`}>
                                            {player.player_name}
                                        </td>
                                        {tournament && tournament?.skill_fields.map((skill, index) => (
                                            <td
                                                key={index}
                                                className="p-4 text-lg border-b border-[#3a2b7d] text-[#b8b8b8]"
                                            >
                                                {player.skills[skill] ? player.skills[skill] : "—"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {players.length === 0 && (
                        <div className="text-center p-8 bg-[#22154F] rounded-lg text-[#a8a8a8] text-lg">
                            No players found in this category.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};