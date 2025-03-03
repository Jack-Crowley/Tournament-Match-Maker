"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faTrash } from "@fortawesome/free-solid-svg-icons";
import { BracketPlayer, Matchup } from "@/types/bracketTypes";
import { createClient } from "@/utils/supabase/client";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { motion } from "framer-motion";
import { faCrown } from "@fortawesome/free-solid-svg-icons/faCrown";
import { PlayerManagementTabs } from "../playerManagementTabs";

interface MatchupModalProps {
    isOpen: boolean;
    setOpen: (state: boolean) => void;
    matchup: Matchup;
}

export const MatchupModal = ({ isOpen, setOpen, matchup }: MatchupModalProps) => {
    const [editedMatchup, setEditedMatchup] = useState<Matchup>(matchup);
    const [addPlayersIndex, setAddPlayersIndex] = useState<number>(-1)
    const modalRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const [locked, setLocked] = useState<boolean>(false)
    const [removedPlayersList, setRemovedPlayersList] = useState<number[]>([])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setEditedMatchup(matchup)
                setOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, setOpen, matchup]);

    useEffect(() => {
        async function LookupNextMatch() {
            if (!isOpen) {return}

            const { data } = await supabase.from("tournament_matches").select("*")
                .eq("tournament_id", matchup.tournament_id)
                .eq("match_number", Math.ceil(matchup.match_number / 2))
                .eq("round", matchup.round + 1).single()

            setLocked(data && data.winner)
        }

        setEditedMatchup(matchup);
        setRemovedPlayersList([])
        LookupNextMatch()
    }, [matchup, supabase, isOpen]);

    const OpenAddPlayerDropdown = (index: number) => {
        setAddPlayersIndex(index)
    }

    const updateMatch = async () => {
        const winnerUUID = editedMatchup.winner;
        try {
            const { error } = await supabase
                .from("tournament_matches")
                .update({
                    winner: winnerUUID || null,
                    players: editedMatchup.players,
                })
                .eq("id", String(matchup.id));

            for (let i = 0; i < removedPlayersList.length; i++) {
                const playerIndex: number = removedPlayersList[i];

                if (matchup.round > 1) {
                    const { error } = await supabase.from("tournament_matches").update({ winner: null })
                        .eq("match_number", matchup.match_number * 2 - playerIndex % 2 + 1)
                        .eq("round", matchup.round - 1)
                        .eq("tournament_id", matchup.tournament_id)

                    if (error) {
                        console.log(error)
                    }
                }
            }

            if (error) {
                console.error("Error updating matchup:", error);
            } else {
                if (winnerUUID) propagatePlayer(winnerUUID);
                setEditedMatchup((prev) => ({ ...prev, winnerUUID: winnerUUID }));
                setOpen(false);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
        }
    };

    const handleAddPlayer = (player : BracketPlayer, index : number) => {
        const players: BracketPlayer[] = editedMatchup.players || [];
        const playerIndex = index;

        while (players.length < 2) {
            players.push({
                uuid: "",
                name: "",
                email: "",
                account_type: "placeholder",
            });
        }

        if (playerIndex >= players.length) {
            for (let i = players.length; i < playerIndex; i++) {
                players.push({
                    uuid: "",
                    name: "",
                    email: "",
                    account_type: "placeholder",
                });
            }
        }

        players[playerIndex] = player;

        setEditedMatchup((prev) => ({...prev, players:players}))
    }


    const changeWinner = (playerUUID: string) => {
        console.log("chaning winner")
        const winner = editedMatchup.players.find(player => player.uuid === playerUUID);
        if (!winner) {
            return console.error("No player found? for winner");
        }

        setEditedMatchup((prev) => ({ ...prev, winner: playerUUID }));
        console.log("the new winner is in matchup", editedMatchup);
    };

    const propagatePlayer = async (playerUuid: string) => {
        const player: BracketPlayer | undefined = editedMatchup.players.find(player => player.uuid === playerUuid);
        if (!player) return console.error("Player not found for propagation");

        const round = editedMatchup.round + 1;
        const matchNumber = Math.ceil(editedMatchup.match_number / 2);
        console.log("match number is ", matchNumber);

        try {
            const { data, error: fetchError } = await supabase
                .from("tournament_matches")
                .select("*")
                .eq("tournament_id", matchup.tournament_id)
                .eq("round", round)
                .eq("match_number", matchNumber)
                .single();

            if (fetchError && fetchError.code !== "PGRST116") {
                console.error("Error fetching matchup:", fetchError.message);
                return;
            }

            const existingMatchup: Matchup | null = data ? (data as Matchup) : null;

            if (existingMatchup) {
                const players: BracketPlayer[] = existingMatchup.players || [];
                const playerIndex = 1 - editedMatchup.match_number % 2

                while (players.length < 2) {
                    players.push({
                        uuid: "",
                        name: "",
                        email: "",
                        account_type: "placeholder",
                    });
                }

                if (playerIndex >= players.length) {
                    for (let i = players.length; i < playerIndex; i++) {
                        players.push({
                            uuid: "",
                            name: "",
                            email: "",
                            account_type: "placeholder",
                        });
                    }
                }

                players[playerIndex] = player;

                const { error: updateError } = await supabase
                    .from("tournament_matches")
                    .update({ players: players })
                    .eq("id", existingMatchup.id);

                if (updateError) {
                    console.error("Error updating players in existing matchup:", updateError.message);
                } else {
                    console.log("Updated existing matchup by replacing placeholder player");
                }
            } else {
                console.log("No existing matchup found, inserting new matchup");

                const placeHolderPlayer = { uuid: "", name: "", email: "", account_type: "placeholder" };
                const players = editedMatchup.match_number % 2 === 0 ? [placeHolderPlayer, player] : [player, placeHolderPlayer];

                const newMatchup = {
                    tournament_id: matchup.tournament_id,
                    match_number: matchNumber,
                    players,
                    round,
                };

                const { error: insertError } = await supabase
                    .from("tournament_matches")
                    .insert(newMatchup);

                if (insertError) {
                    console.error("Error inserting new matchup:", insertError.message);
                } else {
                    console.log("Inserted new matchup successfully");
                }
            }
        } catch (err) {
            console.error("Unexpected error in propagatePlayer:", err);
        }
    };

    const removePlayer = async (playerUuid: string) => {
        const updatedPlayers = editedMatchup.players.map(player =>
            player.uuid === playerUuid ? { uuid: "", name: "", email: "", account_type: "placeholder" } : player
        );

        setRemovedPlayersList(prev => [...prev, editedMatchup.players.map(player => player.uuid).indexOf(playerUuid)])

        setEditedMatchup((prev) => ({ ...prev, players: updatedPlayers }));
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={modalRef} className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]">
                <h2 className="text-xl font-bold mb-4 text-white">Edit Matchup</h2>

                <div className="space-y-4">
                    {editedMatchup.players.map((player, index) => (
                        <div key={player.uuid} className=" ">
                            {player.name ? (
                                <div className="flex items-center justify-between bg-[#2A2A2A] p-3 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <motion.div
                                            className="relative hover:cursor-pointer"
                                            whileHover={{ scale: 1.1 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            {player.uuid === editedMatchup.winner ? (
                                                <FontAwesomeIcon
                                                    icon={faCrown}
                                                    className="text-yellow-400"
                                                    size="2x"
                                                />
                                            ) : (
                                                <motion.div
                                                    initial={{ color: "rgba(0,0,0,0)" }}
                                                    whileHover={{ color: `${locked ? "rgba(0,0,0,0)" : "rgba(255, 255, 0, 0.2)"}`, stroke: "rgba(255, 255, 255, 0.5)" }}
                                                    onClick={() => { if (!locked) changeWinner(player.uuid) }}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faCrown}
                                                        className="stroke-2 stroke-white"
                                                        size="2x"
                                                    />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                        <span className=" text-white">{player.name}</span>
                                        {player.account_type === "logged_in" && (
                                            <span className="text-sm text-gray-400">{player.email}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {locked ? (
                                            <input
                                                type="number"
                                                value={player.score}
                                                readOnly
                                                className="w-20 p-2 bg-[#1f1f1f] border-b-2 border-[#7458DA] text-white rounded-lg focus:outline-none focus:border-[#604BAC]"
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                value={player.score}
                                                onChange={(e) => {
                                                    const newScore = parseInt(e.target.value) || 0;
                                                    setEditedMatchup(prev => ({
                                                        ...prev,
                                                        players: prev.players.map(p =>
                                                            p.uuid === player.uuid ? { ...p, score: newScore } : p
                                                        )
                                                    }));
                                                }}
                                                className="w-20 p-2 bg-[#3A3A3A] border-b-2 border-[#7458DA] text-white rounded-lg focus:outline-none focus:border-[#604BAC]"
                                            />
                                        )}

                                        {player.account_type === "logged_in" && (
                                            <button className="p-2 bg-[#604BAC] rounded-lg text-white hover:bg-[#7458DA]">
                                                <FontAwesomeIcon icon={faEnvelope} />
                                            </button>
                                        )}
                                        <button className={`p-2 ${!locked
                                            ? "bg-[#c02a2a] border-[#c02a2a] hover:bg-[#a32424] hover:border-[#a32424]"
                                            : "border-[#c02a2a8b] bg-[#4512127b] cursor-not-allowed"
                                            } rounded-lg text-white border-[1px]`} onClick={() => { if (!locked) removePlayer(player.uuid) }}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full">
                                    {!locked && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => OpenAddPlayerDropdown(index)}
                                            className="flex w-full items-center justify-center px-6 py-3 bg-[#342373] text-white rounded-lg shadow-lg hover:bg-[#674dc8] transition-colors duration-200"
                                        >
                                            <FontAwesomeIcon icon={faPlus} className="text-white text-lg" />
                                            <span className="ml-2 text-white">Add Player</span>
                                        </motion.button>
                                    )}
                                    {addPlayersIndex == index && (
                                        <div className="w-full">
                                            <PlayerManagementTabs tournamentID={matchup.tournament_id} onClose={(player : BracketPlayer) => handleAddPlayer(player, index)} />
                                        </div>
                                    )
                                    }
                                </div>
                            )}

                        </div>
                    ))}
                </div>


                {locked ? (
                    <div className="text-center w-full mt-5">
                        <h1>This match has been locked as the next match in the series has already had a winner declared</h1>
                        <button
                            className="mt-5 bg-[#2f2f2f] text-white px-4 py-2 rounded-lg hover:bg-[#3C3C3C] transition-colors"
                            onClick={() => { setOpen(false); setEditedMatchup(matchup) }}
                        >
                            Go Back
                        </button>
                    </div>

                ) : (
                    <div className="mt-8 space-x-4 flex justify-end">
                        <button
                            className="bg-[#2C2C2C] text-white px-4 py-2 rounded-lg hover:bg-[#3C3C3C] transition-colors"
                            onClick={() => { setOpen(false); setEditedMatchup(matchup) }}
                        >
                            Cancel
                        </button>
                        <button
                            className="bg-[#7458DA] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
                            onClick={() => updateMatch()}
                        >
                            Save Changes
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
