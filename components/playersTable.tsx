"use client"

import { Player } from "@/types/playerTypes";
import { Checkbox, CheckboxWithEvent } from "./checkbox";
import { useEffect, useState } from "react";
import { useMessage } from "@/context/messageContext";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/types/tournamentTypes";
import { PlayerModal } from "./modals/editPlayersModal";
import { ConfirmModal, ConfirmModalInformation } from "./modals/confirmationModal";

export const PlayersTable = ({ players, setPlayers, otherPlayers, setOtherPlayers, type, tournament, permission_level }: { permission_level: string, players: Player[], setPlayers: (players: Player[]) => void, otherPlayers: Player[], setOtherPlayers: React.Dispatch<React.SetStateAction<Player[]>>, type: string, tournament: Tournament }) => {
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
    const [modalPlayer, setModalPlayer] = useState<Player | null>(null)

    const [canDelete, setCanDelete] = useState<boolean>(false)

    useEffect(() => {
        setCanDelete(permission_level == "admin" || permission_level == "owner")
    }, [permission_level])

    const [confirmModalInfo, setConfirmModalInfo] = useState<ConfirmModalInformation | null>(null)

    const { triggerMessage } = useMessage()
    const supabase = createClient()

    const handleSelectPlayer = (playerId: string) => {
        const newSelectedPlayers = new Set(selectedPlayers);
        if (newSelectedPlayers.has(playerId)) {
            newSelectedPlayers.delete(playerId);
        } else {
            newSelectedPlayers.add(playerId);
        }
        setSelectedPlayers(newSelectedPlayers);
    };

    const handleBulkDelete = async () => {
        if (selectedPlayers.size === 0) {
            triggerMessage("No players selected", "red");
            return;
        }

        const { error } = await supabase
            .from('tournament_players')
            .delete()
            .in('id', Array.from(selectedPlayers));

        if (error) {
            triggerMessage("Error deleting players", "red");
        } else {
            triggerMessage("Players deleted successfully", "green");
            setPlayers(players.filter(player => !selectedPlayers.has(player.id)));
            setSelectedPlayers(new Set());
        }
    };

    const handleBulkSwitch = async () => {
        const newType = type == "active" ? "waitlist" : "active"

        if (selectedPlayers.size === 0) {
            triggerMessage("No players selected", "red");
            return;
        }

        if (type == "waitlist" && tournament.max_players && selectedPlayers.size + otherPlayers.length > tournament.max_players) {
            const waitlistSwitchConfirm: ConfirmModalInformation = {
                title: "Are you sure you want to do this?",
                content: `Switching ${selectedPlayers.size > 1 ? `these ${selectedPlayers.size} players` : "this 1 player"} over to the active players table would violate the maximum players constraint`,
                onCancel: () => { setConfirmModalInfo(null) },
                onSuccess: async () => {
                    const { error } = await supabase
                        .from('tournament_players')
                        .update({ type: newType })
                        .in('id', Array.from(selectedPlayers));

                    if (error) {
                        triggerMessage("Error deleting players", "red");
                    } else {
                        triggerMessage(`Players brought to active successfully`, "green");
                        setOtherPlayers((prev) => [...prev, ...players.filter(player => selectedPlayers.has(player.id))])
                        setPlayers(players.filter(player => !selectedPlayers.has(player.id)));
                        setSelectedPlayers(new Set());
                    }

                    setConfirmModalInfo(null)
                }
            }

            setConfirmModalInfo(waitlistSwitchConfirm)
            return;
        }

        const { error } = await supabase
            .from('tournament_players')
            .update({ type: newType })
            .in('id', Array.from(selectedPlayers));

        if (error) {
            triggerMessage("Error deleting players", "red");
        } else {
            triggerMessage(`Players ${type == "active" ? "waitlisted" : "brought to active"} successfully`, "green");
            setOtherPlayers((prev) => [...prev, ...players.filter(player => selectedPlayers.has(player.id))])
            setPlayers(players.filter(player => !selectedPlayers.has(player.id)));
            setSelectedPlayers(new Set());
        }
    };

    return (
        <div>
            {modalPlayer && (
                <PlayerModal
                    isOpen={modalPlayer != null}
                    onClose={() => setModalPlayer(null)}
                    playerForModal={modalPlayer}
                    tournament={tournament}
                />
            )}
            <ConfirmModal information={confirmModalInfo} />

            {players.length > 0 && (
                <div className={`mb-6 ${type == "active" ? "" : "mt-12"} mx-auto`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[#7458da] font-bold text-2xl">{type == "active" ? "Registered Players" : "Waitlist"}</h2>
                        {canDelete && (
                            <div className="space-x-4">

                                <button
                                    className={`px-4 py-2 border-2 transition-all duration-300 ease-in-out rounded-lg text-white transform ${selectedPlayers.size > 0
                                        ? "bg-[#1f1f1f] border-[#222222] hover:bg-[#171717] hover:border-[#171717]"
                                        : "border-[#000000] bg-[#1717178d] cursor-not-allowed"
                                        }`}
                                    onClick={() => handleBulkSwitch()}
                                >
                                    {type == "active" ? "Move to Waitlist" : "Bring out of Waitlist"}
                                </button>
                                <button
                                    className={`px-4 py-2 border-2 transition-all duration-300 ease-in-out rounded-lg text-white transform ${selectedPlayers.size > 0
                                        ? "bg-[#c02a2a] border-[#c02a2a] hover:bg-[#a32424] hover:border-[#a32424]"
                                        : "border-[#c02a2a8b] bg-[#4512127b] cursor-not-allowed"
                                        }`}
                                    onClick={() => handleBulkDelete()}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    <table className="w-full mx-auto bg-deep rounded-lg shadow-lg">
                        <thead className="bg-[#1b113d]">
                            <tr>
                                {canDelete && (
                                    <th className="p-3 text-left text-white w-10">
                                        <Checkbox deep={true} checked={selectedPlayers.size === players.length} onChange={() => {
                                            if (selectedPlayers.size != players.length) {
                                                setSelectedPlayers(new Set(players.map(player => player.id)));
                                            } else {
                                                setSelectedPlayers(new Set());
                                            }
                                        }} />
                                    </th>
                                )}
                                <th className="p-3 text-left text-white truncate max-w-[150px]">Name</th>
                                {tournament?.skill_fields.map((skill, index) => (
                                    <th key={index} className="p-3 text-left text-white truncate max-w-[150px] overflow-hidden text-ellipsis">
                                        {skill}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((player) => (
                                <tr
                                    key={player.id}
                                    onClick={(e: any) => {
                                        if (e.target.tagName !== "INPUT") {
                                            setModalPlayer(player);
                                        }
                                    }}
                                    className={`hover:bg-[#2a1b5f] bg-[#22154F] ${modalPlayer && modalPlayer.id == player.id ? "bg-[#2a1b5f]" : ""} transition-colors duration-50 cursor-pointer`}
                                >
                                    {canDelete && (
                                        <td className="p-3">
                                            <CheckboxWithEvent
                                                checked={selectedPlayers.has(player.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectPlayer(player.id);
                                                }}
                                            />
                                        </td>
                                    )}
                                    <td className={`p-3 ${player.is_anonymous ? "text-white" : "text-[#c8c8c8]"}`}>{player.player_name}</td>
                                    {tournament?.skill_fields.map((skill, index) => (
                                        <td key={index} className="p-3">{player.skills[skill] ? player.skills[skill] : "N/A"}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}