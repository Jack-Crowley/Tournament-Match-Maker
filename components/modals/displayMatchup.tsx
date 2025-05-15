"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus, faCrown, faTimes, faHandshake } from "@fortawesome/free-solid-svg-icons";
import { BracketPlayer, Matchup } from "@/types/bracketTypes";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerManagementTabs } from "../playerManagementTabs";
import { TournamentPlayer } from "@/types/playerTypes";
import { User } from "@/types/userType";

interface MatchupModalProps {
    isOpen: boolean;
    setOpen: (state: boolean) => void;
    matchup: Matchup;
    user: User;
    tournament_type: string;
}

export const MatchupModal = ({ isOpen, setOpen, matchup, user, tournament_type }: MatchupModalProps) => {
    // TODO Handle duplicate names
    const [editedMatchup, setEditedMatchup] = useState<Matchup>(matchup);
    const [player1, setPlayer1] = useState<TournamentPlayer | null>();
    const [player2, setPlayer2] = useState<TournamentPlayer | null>();
    const [addPlayersIndex, setAddPlayersIndex] = useState<number>(-1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const [locked, setLocked] = useState<boolean>(false);
    const [removedPlayersList, setRemovedPlayersList] = useState<[string, number][]>([]);


    if (user) { }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setEditedMatchup(matchup);
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
            if (!isOpen) return;

            if (tournament_type == "single") {
                const { data } = await supabase
                    .from("tournament_matches")
                    .select("*")
                    .eq("tournament_id", matchup.tournament_id)
                    .eq("match_number", Math.ceil(matchup.match_number / 2))
                    .eq("round", matchup.round + 1)
                    .single();

                setLocked(data && data.winner);
            }
            else if (tournament_type == "swiss") {
                const { data } = await supabase
                    .from("tournament_matches")
                    .select("*")
                    .eq("tournament_id", matchup.tournament_id)
                    .eq("round", matchup.round + 1)
                    .limit(1)
                    .single();

                setLocked(data);
            }


        }

        setEditedMatchup(matchup);
        setRemovedPlayersList([]);
        setAddPlayersIndex(-1);
        LookupNextMatch();
    }, [matchup, supabase, isOpen, tournament_type]);

    useEffect(() => {
        // Retrieve the rows of player1 and player2 if they exist. 

        async function fetchPlayerData() {

            if (!matchup.players[0].uuid) {
                setPlayer1(null);
            }
            else {
                const { data: data1, error: error1 } = await supabase
                    .from("tournament_players")
                    .select("*")
                    .eq("member_uuid", matchup.players[0].uuid)
                    .eq("tournament_id", matchup.tournament_id)
                    .single();
                if (error1) {
                    console.error("error fetching player 1", error1);
                }
                setPlayer1(data1);
            }
            if (!matchup.players[1].uuid) {
                setPlayer2(null);
            }
            else {
                const { data: data2, error: error2 } = await supabase
                    .from("tournament_players")
                    .select("*")
                    .eq("tournament_id", matchup.tournament_id)
                    .eq("member_uuid", matchup.players[1].uuid)
                    .single();
                if (error2) {
                    console.error("error fetching player 2", error2, matchup.players[1].uuid, matchup.round, matchup.match_number, matchup);
                }
                else {
                    setPlayer2(data2);
                }
            }
        }
        fetchPlayerData();
    }, [isOpen, matchup.players, supabase, matchup]);

    const OpenAddPlayerDropdown = (index: number) => {
        setAddPlayersIndex(index === addPlayersIndex ? -1 : index);
    };

    const updateMatch = async () => {
        setIsLoading(true);
        const winnerUUID = editedMatchup.winner;
        const isTie = editedMatchup.is_tie;
        try {
            // Losers becoming inactive. First lets check if the players exist still:
            if (editedMatchup.players.find(player => player.uuid === player1?.member_uuid)) {
                // update the database
                await supabase
                    .from("tournament_players")
                    .update({
                        type: player1?.type,
                    })
                    .eq("member_uuid", player1?.member_uuid);

            }
            if (editedMatchup.players.find(player => player.uuid === player2?.member_uuid)) {
                await supabase
                    .from("tournament_players")
                    .update({
                        type: player2?.type,
                    })
                    .eq("member_uuid", player2?.member_uuid);
            }


            const { error } = await supabase
                .from("tournament_matches")
                .update({
                    winner: isTie ? null : winnerUUID,
                    is_tie: isTie,
                    players: editedMatchup.players,
                })
                .eq("id", String(matchup.id));

            for (const playerIndex of removedPlayersList) {

                // Losers becoming inactive. First lets check if the players exist still:
                if (playerIndex[0] === player1?.member_uuid) {
                    // update the database
                    await supabase
                        .from("tournament_players")
                        .update({
                            type: player1?.type,
                        })
                        .eq("member_uuid", player1?.member_uuid);
                }
                if (playerIndex[0] === player2?.member_uuid) {
                    await supabase
                        .from("tournament_players")
                        .update({
                            type: player2?.type,
                        })
                        .eq("member_uuid", player2?.member_uuid);
                }


                if (matchup.round > 1) {
                    const { error } = await supabase
                        .from("tournament_matches")
                        .update({ winner: null })
                        .eq("match_number", matchup.match_number * 2 - (playerIndex[1] % 2) + 1)
                        .eq("round", matchup.round - 1)
                        .eq("tournament_id", matchup.tournament_id);

                    if (error) {
                        console.error("Error updating previous match:", error);
                    }
                }
            }

            if (error) {
                console.error("Error updating matchup:", error);
            } else {
                if (winnerUUID && !isTie) await propagatePlayer(winnerUUID);
                setEditedMatchup((prev) => ({ ...prev, winnerUUID: winnerUUID, is_tie: isTie }));
                setOpen(false);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPlayer = (player: BracketPlayer, index: number) => {
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

        setEditedMatchup((prev) => ({ ...prev, players: players }))
    }


    const changeWinner = (playerUUID: string) => {
        const isTie = editedMatchup.is_tie;
        if (isTie) {
            setEditedMatchup((prev) => ({ ...prev, is_tie: false }));
        }

        const winner = editedMatchup.players.find((player) => player.uuid === playerUUID);
        if (!winner) {
            console.error("Player not found");
            return;
        }

        setEditedMatchup((prev) => ({ ...prev, winner: playerUUID }));
        setPlayer1((prev) => {
            if (prev) {
                if (prev.member_uuid !== playerUUID) {
                    return { ...prev, type: "inactive" };
                }
                else {
                    return { ...prev, type: "active" };
                }
            }
        });
        setPlayer2((prev) => {
            if (prev) {
                if (prev.member_uuid !== playerUUID) {
                    return { ...prev, type: "inactive" };
                }
                else {
                    return { ...prev, type: "active" };
                }
            }
        });
    };

    const toggleTie = () => {
        const isTie = !editedMatchup.is_tie;
        const { winner, ...rest } = editedMatchup;

        if (winner) {}

        const updated = {
            ...rest,
            is_tie: isTie,
        };

        setEditedMatchup(updated);

        // If setting as tie, set both players aswwwwww active
        if (isTie) {
            setPlayer1((prev) => {
                if (prev) {
                    return { ...prev, type: "active" };
                }
            });
            setPlayer2((prev) => {
                if (prev) {
                    return { ...prev, type: "active" };
                }
            });
        }
    };

    const propagatePlayer = async (playerUuid: string) => {
        if (tournament_type != "single") return;

        const player = editedMatchup.players.find((player) => player.uuid === playerUuid);
        if (!player) {
            console.error("Player not found for propagation");
            return;
        }

        const round = editedMatchup.round + 1;
        const matchNumber = Math.ceil(editedMatchup.match_number / 2);
        const { data: tournament_data, error: countError } = await supabase
            .from("tournaments")
            .select("max_rounds")
            .eq("id", matchup.tournament_id)
            .single();

        if (round > tournament_data?.max_rounds) {
            return;
        }
        if (countError) {
            console.error("Error fetching tournament data:", countError.message);
            return;
        }

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
                const currentMatchupPlayers: BracketPlayer[] = existingMatchup.players || [];
                const playerIndex = 1 - editedMatchup.match_number % 2

                // Adds in placeholder players as needed

                while (currentMatchupPlayers.length < 2) {
                    currentMatchupPlayers.push({
                        uuid: "",
                        name: "",
                        email: "",
                        account_type: "placeholder",
                    });
                }

                if (playerIndex >= currentMatchupPlayers.length) {
                    for (let i = currentMatchupPlayers.length; i < playerIndex; i++) {
                        currentMatchupPlayers.push({
                            uuid: "",
                            name: "",
                            email: "",
                            account_type: "placeholder",
                        });
                    }
                }

                // If the player has not previously been added to the matchup, add them

                if (!currentMatchupPlayers.find(p => p.uuid === playerUuid)) {
                    currentMatchupPlayers[playerIndex] = player;
                }
                // Otherwise, nothing needs to change
                else {
                    console.log("Player already in matchup, skipping update");
                }

                const { error: updateError } = await supabase
                    .from("tournament_matches")
                    .update({ players: currentMatchupPlayers })
                    .eq("id", existingMatchup.id);

                if (updateError) {
                    console.error("Error updating players in existing matchup:", updateError.message);
                }
            } else {
                const placeholderPlayer: BracketPlayer = {
                    uuid: "",
                    name: "",
                    email: "",
                    account_type: "placeholder",
                };

                player.score = 0;
                const players = editedMatchup.match_number % 2 === 0
                    ? [placeholderPlayer, player]
                    : [player, placeholderPlayer];

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
                }
            }
        } catch (err) {
            console.error("Unexpected error in propagatePlayer:", err);
        }
    };

    const removePlayer = (playerUuid: string) => {
        const playerIndex = editedMatchup.players.findIndex(player => player.uuid === playerUuid);

        if (playerIndex === -1) return;

        const updatedPlayers = [...editedMatchup.players];
        updatedPlayers[playerIndex] = {
            uuid: "",
            name: "",
            email: "",
            account_type: "placeholder"
        };

        setRemovedPlayersList(prev => [...prev, [playerUuid, playerIndex]]);
        setEditedMatchup((prev: any) => ({
            ...prev,
            players: updatedPlayers,
            winner: prev.winner === playerUuid ? null : prev.winner
        }));

        setPlayer1((prev) => {
            if (prev) {
                if (prev.member_uuid === playerUuid) {
                    return { ...prev, type: "inactive" };
                }
                else {
                    return { ...prev, type: "active" };
                }
            }
        });
        setPlayer2((prev) => {
            if (prev) {
                if (prev.member_uuid === playerUuid) {
                    return { ...prev, type: "inactive" };
                }
                else {
                    return { ...prev, type: "active" };
                }
            }
        });
    };


    if (!isOpen) return null;

    // Check if we have both players for the tie button
    const canToggleTie = editedMatchup.players.filter(p => p.uuid).length === 2;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                ref={modalRef}
                className="bg-gradient-to-b from-[#252525] to-[#1E1E1E] p-6 rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] border border-[#333333]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {locked ? "Match Details" : "Edit Matchup"}
                    </h2>
                    <button
                        onClick={() => { setOpen(false); setEditedMatchup(matchup); }}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                {canToggleTie && !locked && (
                    <div className="mb-6">
                        <motion.button
                            className={`flex items-center justify-center w-full py-3 px-4 rounded-lg border-2 transition-all ${editedMatchup.is_tie
                                    ? "bg-blue-500/20 border-blue-500 text-blue-200"
                                    : "bg-[#2A2A2A] border-[#3A3A3A] text-gray-300 hover:bg-[#343434]"
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={toggleTie}
                        >
                            <FontAwesomeIcon
                                icon={faHandshake}
                                className={`mr-2 ${editedMatchup.is_tie ? "text-blue-300" : "text-gray-400"}`}
                            />
                            <span className="font-medium">
                                {editedMatchup.is_tie ? "Match is a Tie" : "Mark as Tie"}
                            </span>
                        </motion.button>
                    </div>
                )}

                <div className="space-y-4">
                    {editedMatchup.players.map((player, index) => (
                        <div key={index} className="mb-4">
                            {player.name ? (
                                <motion.div
                                    className="flex items-center justify-between bg-[#2A2A2A] p-4 rounded-xl border border-[#3A3A3A] shadow-md"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="flex items-center space-x-4">
                                        <motion.button
                                            className={`relative p-2 rounded-full ${player.uuid === editedMatchup.winner ? 'bg-yellow-500/20' : ''}`}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            disabled={locked || editedMatchup.is_tie}
                                            onClick={() => !locked && !editedMatchup.is_tie && changeWinner(player.uuid)}
                                        >
                                            <FontAwesomeIcon
                                                icon={faCrown}
                                                className={player.uuid === editedMatchup.winner
                                                    ? "text-yellow-400"
                                                    : `${editedMatchup.is_tie ? "text-gray-600" : "text-gray-500 hover:text-yellow-400"}`}
                                                size="lg"
                                            />
                                        </motion.button>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-white">{player.name}</span>
                                            {player.account_type === "logged_in" && (
                                                <span className="text-sm text-gray-400">{player.email}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="number"
                                            value={player.score || 0}
                                            readOnly={locked}
                                            onChange={(e) => {
                                                const newScore = parseInt(e.target.value) || 0;
                                                setEditedMatchup(prev => ({
                                                    ...prev,
                                                    players: prev.players.map(p =>
                                                        p.uuid === player.uuid ? { ...p, score: newScore } : p
                                                    )
                                                }));
                                            }}
                                            className={`w-20 p-2 ${locked
                                                ? 'bg-[#1f1f1f] text-gray-400 cursor-not-allowed'
                                                : 'bg-[#3A3A3A] hover:bg-[#444444]'
                                                } border-b-2 border-[#7458DA] text-white rounded-lg focus:outline-none focus:border-[#604BAC] transition-colors`}
                                        />

                                        <motion.button
                                            className={`p-2 ${!locked
                                                ? "bg-[#c02a2a] border-[#c02a2a] hover:bg-[#a32424]"
                                                : "bg-[#4512127b] border-[#c02a2a8b] cursor-not-allowed opacity-50"
                                                } rounded-lg text-white border transition-colors`}
                                            onClick={() => { if (!locked) removePlayer(player.uuid) }}
                                            disabled={locked}
                                            whileHover={!locked ? { scale: 1.05 } : {}}
                                            whileTap={!locked ? { scale: 0.95 } : {}}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="w-full">
                                    {!locked && (
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => OpenAddPlayerDropdown(index)}
                                            className={`flex w-full items-center justify-center px-6 py-4 ${addPlayersIndex === index
                                                ? "bg-[#4A327F] border-[#7458DA]"
                                                : "bg-[#342373] border-transparent hover:bg-[#3D2A87]"
                                                } text-white rounded-xl shadow-lg transition-all duration-200 border-2`}
                                        >
                                            <FontAwesomeIcon icon={faPlus} className="text-white" />
                                            <span className="ml-2 font-medium">
                                                {addPlayersIndex === index ? "Cancel" : "Add Player"}
                                            </span>
                                        </motion.button>
                                    )}
                                    <AnimatePresence>
                                        {addPlayersIndex === index && (
                                            <motion.div
                                                className="w-full mt-3 bg-[#2A2A2A] p-4 rounded-xl border border-[#3A3A3A]"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <PlayerManagementTabs
                                                    tournamentID={matchup.tournament_id}
                                                    onClose={(player: BracketPlayer) => handleAddPlayer(player, index)}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {editedMatchup.is_tie && !locked && (
                    <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-blue-200 text-sm flex items-center">
                            <FontAwesomeIcon icon={faHandshake} className="mr-2" />
                            This match is marked as a tie.
                        </p>
                    </div>
                )}

                {locked ? (
                    <div className="text-center w-full mt-6">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-5">
                            {tournament_type == "single" && (
                                <p className="text-yellow-200 text-sm">
                                    This match has been locked because the next match in the tournament already has a winner declared.
                                </p>
                            )}
                            {tournament_type == "swiss" && (
                                <p className="text-yellow-200 text-sm">
                                    This match has been locked because the next round has already been started.
                                </p>
                            )}

                        </div>
                        <motion.button
                            className="mt-2 bg-[#3A3A3A] text-white px-6 py-3 rounded-xl hover:bg-[#4A4A4A] transition-colors font-medium"
                            onClick={() => { setOpen(false); setEditedMatchup(matchup); }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Close
                        </motion.button>
                    </div>
                ) : (
                    <div className="mt-8 space-x-4 flex justify-end">
                        <motion.button
                            className="bg-[#2C2C2C] text-white px-5 py-3 rounded-xl hover:bg-[#3C3C3C] transition-colors font-medium"
                            onClick={() => { setOpen(false); setEditedMatchup(matchup); }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={isLoading}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            className={`bg-gradient-to-r from-[#7458DA] to-[#604BAC] text-white px-5 py-3 rounded-xl hover:opacity-90 transition-all font-medium ${isLoading ? 'opacity-70' : ''}`}
                            onClick={updateMatch}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};