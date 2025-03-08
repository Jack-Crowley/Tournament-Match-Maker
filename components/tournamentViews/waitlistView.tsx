"use client"

import { useMessage } from "@/context/messageContext";
import { Player } from "@/types/playerTypes";
import { Bracket, BracketPlayer } from "@/types/bracketTypes";
import { Tournament } from "@/types/tournamentTypes";
import { createClient } from "@/utils/supabase/client";
import { faUserClock, faExclamationCircle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TournamentBracket, { BracketViewType } from "./single/bracketView";
import { User } from "@/types/userType";

export const WaitlistView = ({ tournamentID, bracket, user }: { tournamentID: number, bracket: Bracket, user:User }) => {
    const [activePlayer, setActivePlayer] = useState<Player | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isAdding, setIsAdding] = useState<boolean>(false)

    const { triggerMessage } = useMessage();
    const supabase = createClient();

    const addPlayerSuccess = () => {
        if (!activePlayer) return;

        setPlayers(players.filter(player => player.member_uuid != activePlayer.member_uuid))
        setActivePlayer(null)
        setIsAdding(false)
    }

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);

            const { data, error } = await supabase
                .from("tournament_players")
                .select("*")
                .eq("tournament_id", tournamentID)
                .in("type", ["waitlist", "inactive"]);

            if (error) {
                triggerMessage("Error fetching waitlist", "red");
                console.log(error)
            } else {
                data.sort((a, b) => a.last_update - b.last_update)
                setPlayers(data as Player[]);
            }

            const { data: tourn, error: tournamentError } = await supabase
                .from("tournaments")
                .select("*")
                .eq("id", tournamentID)
                .single();

            if (tournamentError) {
                triggerMessage("Error fetching tournament details", "red");
                console.log(error)
            } else {
                setTournament(tourn as Tournament);
            }
            setIsLoading(false);
        }

        loadData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournamentID, supabase]);

    const handlePlayerClick = (player: Player) => {
        if (user.permission_level == "player" || user.permission_level == "viewer" || user.permission_level == "scorekeeper") return;

        setActivePlayer(activePlayer?.id === player.id ? null : player);
    };

    return (
        <div>
            {isAdding && tournament ? (
                <TournamentBracket user={user} bracketViewType={BracketViewType.AddPlayer} tournamentID={Number(tournament.id)} bracket={bracket} newPlayer={activePlayer as unknown as BracketPlayer} onClose={addPlayerSuccess} />
            ) : (
                <motion.div
                    className="w-full max-w-6xl mx-auto bg-[#1F1346] p-6 md:p-12 rounded-2xl shadow-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header Section */}
                    <motion.div
                        className="relative mb-8"
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative px-6 pt-8 md:px-10">
                                <div className="flex items-center justify-center mb-6">
                                    <h1 className="text-[#7458da] font-bold text-3xl md:text-4xl text-center">
                                        <FontAwesomeIcon icon={faUserClock} className="mr-3" />
                                        Waitlist
                                    </h1>
                                </div>
                            </div>
                            {tournament && (
                                <p className="text-[#b8b8b8] text-lg text-center max-w-2xl">
                                    Players on standby for <span className="text-white font-medium">{tournament.name || "this tournament"}</span>
                                </p>
                            )}
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                className="flex justify-center items-center py-20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-[#3a2b7d] border-t-[#7458da] rounded-full animate-spin"></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isLoading && (
                        <AnimatePresence>
                            {players.length > 0 ? (
                                <motion.div
                                    className="mb-8 mt-8"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                    <div className="overflow-hidden rounded-lg shadow-2xl bg-[#2a1a66] p-4 md:p-8">
                                        <div className="overflow-x-auto">
                                            <table className="w-full mx-auto bg-deep rounded-lg shadow-lg">
                                                <thead className="bg-[#1b113d]">
                                                    <tr className="">
                                                        <th className="p-4 text-left text-white font-semibold text-lg border-b-2 border-[#3a2b7d]">Name</th>
                                                        {tournament?.skill_fields?.map((skill, index) => (
                                                            <th
                                                                key={index}
                                                                className="p-4 text-left text-white font-semibold text-lg border-b-2 border-[#3a2b7d] truncate max-w-[150px]"
                                                            >
                                                                {skill}
                                                            </th>
                                                        ))}
                                                        <th className="p-4 text-center text-white font-semibold text-lg border-b-2 border-[#3a2b7d] w-16">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {players.map((player) => (
                                                        <motion.tr
                                                            key={player.id}
                                                            onClick={() => handlePlayerClick(player)}
                                                            className={`
                                                        hover:bg-[#2a1b5f] bg-[#22154F] ${activePlayer && activePlayer.id == player.id ? "bg-[#342373]" : ""} transition-colors duration-50 cursor-pointer
                                                    `}
                                                        >
                                                            <td className={`p-4 text-lg border-b border-[#3a2b7d] ${player.is_anonymous ? "text-white font-medium" : "text-[#d8d8d8] font-medium"}`}>
                                                                {player.player_name}
                                                            </td>
                                                            {tournament?.skill_fields?.map((skill, index) => (
                                                                <td
                                                                    key={index}
                                                                    className="p-4 text-lg border-b border-[#3a2b7d] text-[#b8b8b8]"
                                                                >
                                                                    {player.skills && player.skills[skill] ? (
                                                                        <div className="flex items-center">
                                                                            <div className="w-2 h-2 rounded-full bg-[#7458da] mr-2"></div>
                                                                            {player.skills[skill]}
                                                                        </div>
                                                                    ) : "—"}
                                                                </td>
                                                            ))}
                                                            {(player as any).type == "waitlist" ? (
                                                                <td className="p-4 text-center border-b border-[#3a2b7d]">
                                                                    <div className="flex justify-center">
                                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#3a2b7d] text-[#a899e0]">
                                                                            Waitlist
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            ) : (
                                                                <td className="p-4 text-center border-b border-[#1E3A8A]">
                                                                    <div className="flex justify-center">
                                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1E3A8A] text-[#BFDBFE]">
                                                                            Inactive
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            )}

                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Player Detail View */}
                                    <AnimatePresence>
                                        {activePlayer && (
                                            <motion.div
                                                className="mt-6 p-6 bg-[#2a1a66] rounded-lg shadow-xl"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 w-12 h-12 bg-[#3a2b7d] rounded-full flex items-center justify-center">
                                                        <span className="text-xl font-bold text-white">
                                                            {activePlayer.player_name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <h3 className="text-xl font-bold text-white">{activePlayer.player_name}</h3>
                                                        {(activePlayer as any).type == "waitlist" && (<p className="text-[#b8b8b8] mt-1">Waitlist Position: #{players.findIndex(p => p.id === activePlayer.id) + 1}</p>)} 

                                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {tournament?.skill_fields?.map((skill, index) => (
                                                                activePlayer.skills && activePlayer.skills[skill] && (
                                                                    <div key={index} className="bg-[#342575] p-3 rounded-md">
                                                                        <p className="text-[#a899e0] text-sm">{skill}</p>
                                                                        <p className="text-white font-medium">{activePlayer.skills[skill]}</p>
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>

                                                        <div className="mt-6 flex flex-wrap gap-2">
                                                            <button className="px-4 py-2 bg-[#7458da] hover:bg-[#634bc1] text-white rounded-md transition-colors"
                                                                onClick={() => setIsAdding(true)}>
                                                                Move to Roster
                                                            </button>
                                                            <button className="px-4 py-2 bg-[#342575] hover:bg-[#3a2b7d] text-white rounded-md transition-colors">
                                                                Contact Player
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="text-center p-8 bg-[#22154F] rounded-lg shadow-lg"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                    <FontAwesomeIcon icon={faExclamationCircle} className="text-[#7458da] text-4xl mb-4" />
                                    <h3 className="text-white text-xl font-semibold mb-2">No Players on Waitlist</h3>
                                    <p className="text-[#a8a8a8] text-lg">
                                        There are currently no players waiting to join this tournament.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Info Section at bottom */}
                    {!isLoading && players.length > 0 && (
                        <motion.div
                            className="mt-8 p-4 bg-[#221655] rounded-lg border border-[#3a2b7d]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-[#7458da] text-xl mt-1" />
                                <div className="ml-3">
                                    <h4 className="text-white font-medium">About the Waitlist</h4>
                                    <p className="text-[#b8b8b8] text-sm mt-1">
                                        Players on the waitlist are players who have joined the tournament after the maximum players were reached or were specifically moved here.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {!isLoading && players.length > 0 && (
                        <motion.div
                            className="mt-8 p-4 bg-[#221655] rounded-lg border border-[#3a2b7d]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-[#7458da] text-xl mt-1" />
                                <div className="ml-3">
                                    <h4 className="text-white font-medium">About Inactive Players</h4>
                                    <p className="text-[#b8b8b8] text-sm mt-1">
                                        Inactive players were players who were originally in the tournament, but have been removed
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
            <div className="h-10"></div>
        </div>
    );
};