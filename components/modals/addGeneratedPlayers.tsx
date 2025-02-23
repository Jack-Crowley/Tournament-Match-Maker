"use client"

import { useMessage } from "@/context/messageContext";
import { Tournament } from "@/types/tournamentTypes";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export const AddPlaceholderPlayersModal = ({ isOpen, setOpen, tournament }: { tournament: Tournament, isOpen: boolean, setOpen: (state: boolean) => void, }) => {
    const [prefix, setPrefix] = useState<string>("")
    const [numberOfPlayers, setNumberOfPlayers] = useState<number>(0)
    const supabase = createClient()
    const { triggerMessage } = useMessage()

    const handleSave = async () => {
        if (!prefix || !numberOfPlayers) {
            triggerMessage("Prefix and number of players are required", "red");
            return;
        }

        const { data: existingPlayers, error: existingPlayersError } = await supabase
            .from('tournament_players')
            .select('player_name')
            .eq('tournament_id', tournament.id)

        if (existingPlayersError) {
            triggerMessage("Error loading existing players: " + existingPlayersError.message, "red");
            setOpen(false);
            return;
        }

        const existingPlayerNames = new Set(existingPlayers.map(player => player.player_name));

        for (let i = 1; i <= numberOfPlayers; i++) {
            let playerName = `${prefix}${i}`;
            let counter = i;

            while (existingPlayerNames.has(playerName)) {
                counter++;
                playerName = `${prefix}${counter}`;
            }

            existingPlayerNames.add(playerName);

            const update = {
                tournament_id: tournament.id,
                member_uuid: uuidv4(),
                player_name: playerName,
                skills: {},
                is_anonymous: true,
                placeholder_player:true,
            };

            const { error } = await supabase
                .from('tournament_players')
                .insert([update])
                .select();

            if (error) {
                triggerMessage(`Error adding player ${playerName}: ${error.message}`, "red");
            } else {
                triggerMessage(`Successfully added player ${playerName}!`, "green");
            }
        }

        setOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setOpen(false) }}
                >
                    <motion.div
                        className="bg-[#1E1E1E] p-8 rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-6 text-white">Add Placeholder Players</h2>

                        {/* Prefix Input */}
                        <div className="mb-6">
                            <label className="text-white block text-sm mb-2">Prefix</label>
                            <input
                                type="text"
                                value={prefix}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value)}
                                placeholder="Player."
                                className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                            />
                        </div>

                        {/* Number Input */}
                        <div className="mb-6">
                            <label className="text-white block text-sm mb-2">Number of Players</label>
                            <input
                                type="number"
                                value={numberOfPlayers}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setNumberOfPlayers(Number(e.target.value))}
                                placeholder="Enter number of players"
                                className="w-full p-3 bg-[#2a2a2a] border-b-2 border-[#7458da] text-white focus:outline-none focus:border-[#604BAC]"
                            />
                        </div>

                        {/* Save and Close Buttons */}
                        <div className="mt-8 space-x-4">
                            <button onClick={handleSave} className="bg-[#604BAC] text-white px-6 py-2 rounded-lg">
                                Save
                            </button>
                            <button onClick={() => { setOpen(false) }} className="bg-gray-500 text-white px-6 py-2 rounded-lg">
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};