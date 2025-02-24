"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faTrash } from "@fortawesome/free-solid-svg-icons";
import { BracketPlayer, Matchup } from "@/types/bracketTypes";
import { createClient } from "@/utils/supabase/client";


interface MatchupModalProps {
    isOpen: boolean;
    setOpen: (state: boolean) => void;
    matchup: Matchup;
}

export const MatchupModal = ({ isOpen, setOpen, matchup }: MatchupModalProps) => {
    const [editedMatchup, setEditedMatchup] = useState<Matchup>(matchup);
    const [winner, setWinner] = useState<string | null>(matchup.winner ? matchup.winner : null);
    const modalRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, setOpen]);

    const updateMatchWinner = async () => {
        console.log("we are updating this matchup", matchup);
        if (!winner) {
            console.log("No winner selected");
        }
        else {

            const { error: winnerError } = await supabase
                .from("tournament_matches")
                .update({ winner: String(winner) })
                .eq("id", String(matchup.matchId));

            if (winnerError) {
                console.error(`Error updating winner match`, winnerError);
            }
            else {
                setEditedMatchup((prev) => ({ ...prev, winner }));
                propogatePlayer(winner);
            }
        }

        const { error: deletedPlayerError } = await supabase
            .from("tournament_matches")
            .update({ players: editedMatchup.players })
            .eq("id", String(matchup.matchId));



        if (deletedPlayerError) {
            console.error(`Error updating deleting player match`, deletedPlayerError);
        } else {
            setOpen(false);
        }
    };

    const propogatePlayer = async (playerUuid: string) => {
        const player: BracketPlayer | undefined = editedMatchup.players.find(player => player.uuid === playerUuid);
        if (!player) return;
        const round = editedMatchup.round + 1;
        const matchNumber = Math.ceil(editedMatchup.matchNumber / 2);
        const placeHolderPlayer = { uuid: "", name: "", email: "", account_type: "placeholder" };

        const players = [player, placeHolderPlayer];

        const newMatchup = {
            tournament_id: matchup.tournament_id,
            match: matchNumber,
            players: editedMatchup.matchNumber % 2 === 0 ? players.reverse() : players,
            round,
        }

        const { error } = await supabase
            .from("tournament_matches")
            .insert(newMatchup);

        if (error) {
            console.error("Error inserting matchup:", error.message);
            alert(`Failed to insert matchup: ${error.message}`);
            return;
        }

    }

    const removePlayer = async (playerUuid: string) => {
        const updatedPlayers = editedMatchup.players.map(player =>
            player.uuid === playerUuid ? { uuid: "", name: "", email: "", account_type: "placeholder" } : player
        );

        setEditedMatchup((prev) => ({ ...prev, players: updatedPlayers }));
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={modalRef} className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]">
                <h2 className="text-xl font-bold mb-4 text-white">Edit Matchup</h2>

                <div className="space-y-4">
                    {editedMatchup.players.map((player) => (
                        <div key={player.uuid} className="flex items-center justify-between bg-[#2A2A2A] p-3 rounded-lg">
                            <div className="flex flex-col">
                                <span className="text-lg font-semibold text-white">{player.name}</span>
                                {player.account_type === "logged_in" && (
                                    <span className="text-sm text-gray-400">{player.email}</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="number"
                                    value={player.score}
                                    onChange={() => { }}
                                    className="w-20 p-2 bg-[#3A3A3A] border-b-2 border-[#7458DA] text-white rounded-lg focus:outline-none focus:border-[#604BAC]"
                                />
                                {player.account_type === "logged_in" && (
                                    <button className="p-2 bg-[#604BAC] rounded-lg text-white hover:bg-[#7458DA]">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                    </button>
                                )}
                                <button className="p-2 bg-[#cc6363] rounded-lg text-white hover:bg-[#b65050]" onClick={() => { removePlayer(player.uuid) }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium mb-2 text-white">Declare Winner</label>
                    <select
                        value={winner || ""}
                        onChange={(e) => setWinner(e.target.value)}
                        className="w-full p-3 bg-[#2A2A2A] border-b-2 border-[#7458DA] text-white rounded-lg focus:outline-none focus:border-[#604BAC]"
                    >
                        <option value="" disabled className="text-gray-400">
                            Select a winner
                        </option>
                        {editedMatchup.players.map((player) => (
                            <option key={player.uuid} value={player.uuid} className="text-white">
                                {player.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-8 space-x-4 flex justify-end">
                    <button
                        className="bg-[#2C2C2C] text-white px-4 py-2 rounded-lg hover:bg-[#3C3C3C] transition-colors"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-[#7458DA] text-white px-4 py-2 rounded-lg hover:bg-[#604BAC] transition-colors"
                        onClick={() => updateMatchWinner()}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
